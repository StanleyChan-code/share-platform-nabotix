import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pubmedId } = await req.json();
    
    if (!pubmedId) {
      return new Response(
        JSON.stringify({ error: 'PubMed ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching PubMed data for ID: ${pubmedId}`);

    // Fetch from PubMed E-utilities API
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pubmedId}&retmode=json`;
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pubmedId}&retmode=xml`;

    const [summaryResponse, detailResponse] = await Promise.all([
      fetch(summaryUrl),
      fetch(detailUrl)
    ]);

    if (!summaryResponse.ok || !detailResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data from PubMed' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const summaryData = await summaryResponse.json();
    const detailXml = await detailResponse.text();

    // Extract data from summary
    const result = summaryData.result;
    if (!result || !result[pubmedId]) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const article = result[pubmedId];
    
    // Parse abstract from XML (simple regex extraction)
    const abstractMatch = detailXml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/s);
    const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '') : '';

    // Parse authors
    const authors = article.authors || [];
    const authorNames = authors.map((author: any) => author.name).join(', ');

    // Get citation count from PMC (if available)
    let citationCount = 0;
    try {
      const pmcUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pmc&id=${pubmedId}&retmode=json`;
      const pmcResponse = await fetch(pmcUrl);
      if (pmcResponse.ok) {
        const pmcData = await pmcResponse.json();
        // This is a simplified citation count - in reality, you'd need more complex parsing
        citationCount = pmcData.linksets?.[0]?.linksetdbs?.length || 0;
      }
    } catch (error) {
      console.log('Citation count fetch failed:', error);
    }

    const paperData = {
      title: article.title || '',
      abstract: abstract || '',
      journal: article.fulljournalname || article.source || '',
      authors: authorNames,
      pubDate: article.pubdate || '',
      doi: article.elocationid || '',
      citationCount: citationCount,
      pubmedId: pubmedId,
      publicationUrl: `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`
    };

    console.log('Successfully fetched PubMed data:', paperData);

    return new Response(
      JSON.stringify(paperData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching PubMed data:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});