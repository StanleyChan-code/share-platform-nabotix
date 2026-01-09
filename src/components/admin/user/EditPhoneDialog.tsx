import { useEffect, useRef } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/integrations/api/userApi";
import {Input} from "@/components/ui/FormValidator.tsx";

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
  onPhoneUpdated: (newPhone: string) => void;
}

const EditPhoneDialog = ({
  open,
  onOpenChange,
  user,
  onPhoneUpdated,
}: EditPhoneDialogProps) => {
  const { toast } = useToast();
  const prevOpenRef = useRef(open);
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

  // 当对话框打开状态改变时，如果是打开，则重置表单为当前手机号
  useEffect(() => {
    if (!prevOpenRef.current && open && user) {
      form.reset({
        newPhone: user.phone || "",
      });
    }
    prevOpenRef.current = open;
  }, [open, user, form]);

  const onSubmit = async (values: { newPhone: string }) => {
    if (user.phone === values.newPhone) {
      toast({
        title: "提醒",
        description: "手机号未改变",
      });
      onOpenChange(false);
      return;
    }

    try {
      await userApi.updatePhone(user.id, values);
      toast({
        title: "更新成功",
        description: "手机号更新成功",
      });
      onPhoneUpdated(values.newPhone);
      onOpenChange(false);
    } catch (error: any) {
      console.error("更新手机号失败:", error);
      toast({
        title: "错误",
        description: error.response.data.message || "更新手机号失败",
        variant: "destructive",
      });
    }
  };

  const handleClose = (open: boolean) => {
    // 关闭对话框时重置表单
    if (!open) {
      form.reset({ newPhone: user?.phone || "" });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
          className="max-w-md max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
      >
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
                    <Input {...field} type="tel" placeholder="请输入新手机号" validationType="phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm text-muted-foreground">
              <p>注意：修改手机号后需要重新登录</p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
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