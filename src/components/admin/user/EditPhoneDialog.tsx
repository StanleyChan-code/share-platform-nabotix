import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/integrations/api/userApi";

const formSchema = z.object({
  newPhone: z
    .string()
    .min(1, "手机号不能为空")
    .regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
});

interface EditPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onPhoneUpdated: () => void;
}

const EditPhoneDialog = ({
  open,
  onOpenChange,
  user,
  onPhoneUpdated,
}: EditPhoneDialogProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPhone: "",
    },
  });

  // 当用户数据变化时，更新表单默认值
  useEffect(() => {
    if (user) {
      form.reset({
        newPhone: user.phone || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: { newPhone: string }) => {
    try {
      await userApi.updatePhone(user.id, values);
      toast({
        title: "成功",
        description: "手机号更新成功",
      });
      onPhoneUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("更新手机号失败:", error);
      toast({
        title: "错误",
        description: error.message || "更新手机号失败",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>修改手机号</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新手机号</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="请输入新手机号" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit">保存</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPhoneDialog;