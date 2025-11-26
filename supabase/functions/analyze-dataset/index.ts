import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FieldAnalysis {
  name: string;
  label: string;
  type: string;
}

interface AnalysisResult {
  demographicFields: FieldAnalysis[];
  outcomeFields: FieldAnalysis[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { datasetId, filePath } = await req.json();
    
    if (!datasetId || !filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing datasetId or filePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing dataset:', datasetId, 'file:', filePath);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('datasets')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse file based on extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    console.log('File extension:', fileExtension);
    
    let headers: string[] = [];
    let dataRows: Record<string, string>[] = [];

    if (fileExtension === 'csv') {
      // Parse CSV
      const fileContent = await fileData.text();
      console.log('File downloaded, size:', fileContent.length);
      
      const lines = fileContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return new Response(
          JSON.stringify({ error: 'File has insufficient data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      dataRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx] || '';
          return obj;
        }, {} as Record<string, string>);
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel using SheetJS
      const arrayBuffer = await fileData.arrayBuffer();
      console.log('Excel file downloaded, size:', arrayBuffer.byteLength);
      
      // Import SheetJS from esm.sh
      const XLSX = await import('https://esm.sh/xlsx@0.18.5');
      
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        return new Response(
          JSON.stringify({ error: 'Excel file has insufficient data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      headers = jsonData[0].map(h => String(h || '').trim());
      dataRows = jsonData.slice(1).map(row => {
        return headers.reduce((obj, header, idx) => {
          obj[header] = String(row[idx] || '').trim();
          return obj;
        }, {} as Record<string, string>);
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file format. Only CSV and Excel files are supported.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsed data:', headers.length, 'columns,', dataRows.length, 'rows');

    // Calculate statistics for each column
    const statistics = [];
    for (const header of headers) {
      const values = dataRows.map(row => row[header]).filter(v => v !== '');
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      const isNumeric = numericValues.length > values.length * 0.8;
      const totalCount = dataRows.length;
      const missingCount = totalCount - values.length;
      const missingPercentage = (missingCount / totalCount) * 100;

      let meanValue = null;
      let stdDeviation = null;

      if (isNumeric && numericValues.length > 0) {
        meanValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - meanValue!, 2), 0) / numericValues.length;
        stdDeviation = Math.sqrt(variance);
      }

      statistics.push({
        dataset_id: datasetId,
        variable_name: header,
        variable_type: isNumeric ? 'numeric' : 'categorical',
        mean_value: meanValue,
        std_deviation: stdDeviation,
        total_count: totalCount,
        missing_count: missingCount,
        percentage: missingPercentage
      });
    }

    // Insert statistics into database
    const { error: insertError } = await supabase
      .from('dataset_statistics')
      .insert(statistics);

    if (insertError) {
      console.error('Insert statistics error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save statistics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Statistics saved, calling AI for field identification...');

    // Use AI to identify demographic and outcome fields
    const aiAnalysis = await analyzeFieldsWithAI(headers, statistics);

    // Calculate correlations for numeric variables
    const numericStats = statistics.filter(s => s.variable_type === 'numeric');
    const correlations = calculateCorrelations(dataRows, numericStats);

    // Calculate overall missing rate
    const totalCells = dataRows.length * headers.length;
    const totalMissing = statistics.reduce((sum, s) => sum + (s.missing_count || 0), 0);
    const overallMissingRate = (totalMissing / totalCells) * 100;

    // Store comprehensive analysis results
    const { error: analysisError } = await supabase
      .from('analysis_results')
      .insert({
        dataset_id: datasetId,
        total_rows: dataRows.length,
        total_columns: headers.length,
        overall_missing_rate: overallMissingRate,
        correlations: correlations,
        analysis_metadata: {
          numeric_variables: numericStats.length,
          categorical_variables: statistics.length - numericStats.length,
          analysis_version: '1.0'
        }
      });

    if (analysisError) {
      console.error('Insert analysis results error:', analysisError);
    }

    // Update dataset with identified fields
    const { error: updateError } = await supabase
      .from('datasets')
      .update({
        demographic_fields: aiAnalysis.demographicFields,
        outcome_fields: aiAnalysis.outcomeFields
      })
      .eq('id', datasetId);

    if (updateError) {
      console.error('Update dataset error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update dataset fields' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        statisticsCount: statistics.length,
        demographicFields: aiAnalysis.demographicFields,
        outcomeFields: aiAnalysis.outcomeFields,
        analysisResults: {
          totalRows: dataRows.length,
          totalColumns: headers.length,
          overallMissingRate: overallMissingRate.toFixed(2)
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-dataset:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateCorrelations(dataRows: Record<string, string>[], numericStats: any[]): any {
  const correlations: any = {};
  
  if (numericStats.length < 2) return correlations;

  // Calculate Pearson correlation for each pair of numeric variables
  for (let i = 0; i < numericStats.length; i++) {
    for (let j = i + 1; j < numericStats.length; j++) {
      const var1 = numericStats[i].variable_name;
      const var2 = numericStats[j].variable_name;
      
      const values1: number[] = [];
      const values2: number[] = [];
      
      // Collect paired values
      for (const row of dataRows) {
        const val1 = parseFloat(row[var1]);
        const val2 = parseFloat(row[var2]);
        if (!isNaN(val1) && !isNaN(val2)) {
          values1.push(val1);
          values2.push(val2);
        }
      }
      
      if (values1.length > 1) {
        const correlation = pearsonCorrelation(values1, values2);
        if (!isNaN(correlation)) {
          correlations[`${var1}_${var2}`] = {
            variable1: var1,
            variable2: var2,
            correlation: Number(correlation.toFixed(3)),
            sample_size: values1.length
          };
        }
      }
    }
  }
  
  return correlations;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return NaN;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumXSquared += diffX * diffX;
    sumYSquared += diffY * diffY;
  }
  
  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  return denominator === 0 ? 0 : numerator / denominator;
}

async function analyzeFieldsWithAI(
  headers: string[],
  statistics: any[]
): Promise<AnalysisResult> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not found');
    return { demographicFields: [], outcomeFields: [] };
  }

  const prompt = `分析以下医学研究数据集的字段，识别哪些是人口统计学字段，哪些是结局指标字段。

字段列表及统计信息：
${statistics.map(s => `- ${s.variable_name} (${s.variable_type}): 均值=${s.mean_value?.toFixed(2) || 'N/A'}, 缺失率=${s.percentage?.toFixed(1)}%`).join('\n')}

请识别：
1. 人口统计学字段：如年龄(age)、性别(sex/gender)、身高、体重、BMI、种族、教育水平等
2. 结局指标字段：如死亡(death/mortality)、疾病发生、生存时间、治疗效果评分等临床结局

返回 JSON 格式。`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: '你是一个医学数据分析专家。请分析数据集字段并识别人口统计学字段和结局指标字段。'
          },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_fields',
            description: '分类数据集字段为人口统计学字段和结局指标字段',
            parameters: {
              type: 'object',
              properties: {
                demographicFields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: '字段名' },
                      label: { type: 'string', description: '中文标签' },
                      type: { type: 'string', enum: ['numeric', 'categorical'], description: '数据类型' }
                    },
                    required: ['name', 'label', 'type']
                  }
                },
                outcomeFields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: '字段名' },
                      label: { type: 'string', description: '中文标签' },
                      type: { type: 'string', enum: ['numeric', 'categorical', 'binary', 'time_to_event'], description: '数据类型' }
                    },
                    required: ['name', 'label', 'type']
                  }
                }
              },
              required: ['demographicFields', 'outcomeFields']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'classify_fields' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return { demographicFields: [], outcomeFields: [] };
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      return {
        demographicFields: args.demographicFields || [],
        outcomeFields: args.outcomeFields || []
      };
    }

    return { demographicFields: [], outcomeFields: [] };
  } catch (error) {
    console.error('AI analysis error:', error);
    return { demographicFields: [], outcomeFields: [] };
  }
}
