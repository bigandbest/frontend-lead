import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, MoreVertical, Eye, Pencil, Copy, Trash2, Send,
  MessageSquare, Mail, MessageCircle, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const channelIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  sms: { icon: MessageSquare, label: "SMS", color: "bg-info/10 text-info" },
  email: { icon: Mail, label: "Email", color: "bg-warning/10 text-warning" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "bg-success/10 text-success" },
};

const mockTemplates = [
  { id: "1", name: "Welcome New Lead", channel: "sms", slug: "lead_introduction", body: "Hi {{firstName}}, thank you for your interest! Our agent {{assignedTo}} will call you on {{phone}} shortly.", tags: ["onboarding", "welcome"], used: 45, active: true },
  { id: "2", name: "Follow-up Reminder", channel: "email", slug: "lead_followup", body: "Hi {{firstName}}, just checking in on your interest in our services. We'd love to help you get started.", tags: ["followup"], used: 12, active: true },
  { id: "3", name: "Meeting Confirmation", channel: "whatsapp", slug: "meeting_confirm", body: "Hi {{firstName}}, your meeting with {{assignedTo}} is confirmed for tomorrow. See you then!", tags: ["meeting"], used: 28, active: true },
  { id: "4", name: "Status Update", channel: "sms", slug: "status_update", body: "Hi {{firstName}}, your application status has been updated to {{status}}. Contact us for details.", tags: ["status"], used: 67, active: true },
  { id: "5", name: "Promotional Offer", channel: "email", slug: "promo_offer", body: "Hi {{firstName}}, we have an exclusive offer for you! Check out our latest plans starting at just ₹999.", tags: ["promotional"], used: 8, active: false },
  { id: "6", name: "Feedback Request", channel: "whatsapp", slug: "feedback_req", body: "Hi {{firstName}}, we'd love to hear your feedback about our service. Reply with your thoughts!", tags: ["feedback"], used: 15, active: true },
];

const tabs = [
  { label: "All", value: "all", count: 24 },
  { label: "SMS", value: "sms", count: 10 },
  { label: "Email", value: "email", count: 8 },
  { label: "WhatsApp", value: "whatsapp", count: 6 },
];

const variables = ["{{firstName}}", "{{lastName}}", "{{phone}}", "{{email}}", "{{city}}", "{{assignedTo}}", "{{status}}", "{{createdDate}}"];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "", channel: "sms", category: "", content: "", tags: "",
  });

  const filtered = mockTemplates.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab !== "all" && t.channel !== activeTab) return false;
    return true;
  });

  const previewTemplate = mockTemplates.find((t) => t.id === previewOpen);
  const sendTemplate = mockTemplates.find((t) => t.id === sendOpen);

  const renderPreview = (body: string) => {
    return body
      .replace(/\{\{firstName\}\}/g, "Priya")
      .replace(/\{\{lastName\}\}/g, "Sharma")
      .replace(/\{\{phone\}\}/g, "9876543210")
      .replace(/\{\{assignedTo\}\}/g, "Ravi Kumar")
      .replace(/\{\{status\}\}/g, "Qualified")
      .replace(/\{\{email\}\}/g, "priya@gmail.com")
      .replace(/\{\{city\}\}/g, "Delhi")
      .replace(/\{\{createdDate\}\}/g, "Dec 20, 2024");
  };

  const insertVariable = (variable: string) => {
    setNewTemplate({ ...newTemplate, content: newTemplate.content + variable });
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>Message Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">24 total templates</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />New Template
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {["Lead Follow-up", "Introduction", "Reminder", "Promotional", "Feedback"].map((c) => (
              <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === tab.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent border"
            )}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((template) => {
          const ch = channelIcons[template.channel];
          const ChannelIcon = ch.icon;
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", ch.color)}>
                      <ChannelIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", ch.color)}>{ch.label}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewOpen(template.id)}><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                      <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-semibold text-sm mb-0.5">{template.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{template.slug}</p>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">"{template.body}"</p>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">🏷 {tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />Used {template.used} times</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                      template.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {template.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 border-t pt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewOpen(template.id)}>Preview</Button>
                  <Button size="sm" className="flex-1" onClick={() => setSendOpen(template.id)}>
                    <Send className="mr-1 h-3 w-3" />Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
            <DialogDescription>Create a message template with variable placeholders</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Channel *</Label>
                <RadioGroup value={newTemplate.channel} onValueChange={(v) => setNewTemplate({ ...newTemplate, channel: v })} className="flex gap-3">
                  {Object.entries(channelIcons).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <RadioGroupItem value={k} id={`ch-${k}`} />
                      <label htmlFor={`ch-${k}`} className="text-sm cursor-pointer">{v.label}</label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newTemplate.category} onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {["Lead Follow-up", "Introduction", "Reminder", "Promotional", "Feedback", "General"].map((c) => (
                      <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  rows={6}
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Hi {{firstName}}, ..."
                />
                {newTemplate.channel === "sms" && (
                  <p className="text-xs text-muted-foreground">Characters: {newTemplate.content.length} / 160</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Click to insert variable:</Label>
                <div className="flex flex-wrap gap-1">
                  {variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors"
                      onClick={() => insertVariable(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="text-sm font-medium">Live Preview</Label>
              <div className="mt-2 p-4 rounded-lg bg-muted/50 border min-h-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", channelIcons[newTemplate.channel]?.color)}>
                    {channelIcons[newTemplate.channel]?.label} Preview
                  </span>
                </div>
                <p className="text-sm">
                  {newTemplate.content ? renderPreview(newTemplate.content) : (
                    <span className="text-muted-foreground italic">Start typing to see preview...</span>
                  )}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <Label className="text-xs text-muted-foreground">Sample Data</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "firstName", value: "Priya" },
                    { label: "lastName", value: "Sharma" },
                    { label: "phone", value: "9876..." },
                    { label: "assignedTo", value: "Ravi" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">{s.label}:</span>
                      <Input className="h-7 text-xs" defaultValue={s.value} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="outline">Save Draft</Button>
            <Button onClick={() => { toast.success("Template published!"); setCreateOpen(false); }}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewOpen} onOpenChange={() => setPreviewOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate && channelIcons[previewTemplate.channel]?.label} template</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm">{renderPreview(previewTemplate.body)}</p>
              </div>
              <p className="text-xs text-success flex items-center gap-1">✓ All variables resolved</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(null)}>Close</Button>
            <Button onClick={() => { setPreviewOpen(null); if (previewTemplate) setSendOpen(previewTemplate.id); }}>
              <Send className="mr-2 h-4 w-4" />Send to Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <Dialog open={!!sendOpen} onOpenChange={() => setSendOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send: {sendTemplate?.name}</DialogTitle>
            <DialogDescription>Channel: {sendTemplate && channelIcons[sendTemplate.channel]?.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Send Mode</Label>
              <RadioGroup defaultValue="single" className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="single" id="single" />
                  <label htmlFor="single" className="text-sm">Single Lead</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="bulk" id="bulk" />
                  <label htmlFor="bulk" className="text-sm">Bulk (multiple)</label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Select Lead</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search lead by name or phone..." className="pl-9" />
              </div>
            </div>
            {sendTemplate && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <p className="text-sm">{renderPreview(sendTemplate.body)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(null)}>Cancel</Button>
            <Button onClick={() => { toast.success("Message sent!"); setSendOpen(null); }}>
              <Send className="mr-2 h-4 w-4" />Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
