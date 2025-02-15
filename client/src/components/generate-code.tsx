import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReferralSchema, verifyReferralSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function GenerateCode() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/referrals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Referral code generated successfully",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/referrals/verify", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Referral verified successfully",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Manage Referrals</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Referrals</DialogTitle>
          <DialogDescription>
            Generate new referral codes or verify existing ones.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Code</TabsTrigger>
            <TabsTrigger value="verify">Verify Referral</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <GenerateForm mutation={generateMutation} />
          </TabsContent>

          <TabsContent value="verify">
            <VerifyForm mutation={verifyMutation} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function GenerateForm({ mutation }: { mutation: any }) {
  const form = useForm({
    resolver: zodResolver(insertReferralSchema),
    defaultValues: {
      customerAddress: "",
      customerEmail: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="customerAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123 Main St, City, State, ZIP" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Code
        </Button>
      </form>
    </Form>
  );
}

function VerifyForm({ mutation }: { mutation: any }) {
  const form = useForm({
    resolver: zodResolver(verifyReferralSchema),
    defaultValues: {
      referralCode: "",
      referredCustomerAddress: "",
      installationDate: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referral Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referredCustomerAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Customer Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123 Main St, City, State, ZIP" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="installationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Installation Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Referral
        </Button>
      </form>
    </Form>
  );
}