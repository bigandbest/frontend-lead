import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useTodayAttendance, useAttendanceHistory, useLeaveBalance, useCheckIn, useCheckOut, useRequestLeave } from "@/hooks/useAttendance";

const leaveStatusBadge: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground" },
  pending: { label: "Pending", className: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export default function AttendancePage() {
  const [mainTab, setMainTab] = useState("my");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [checkInMode, setCheckInMode] = useState<"in" | "out">("in");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [leaveForm, setLeaveForm] = useState({ type: "", startDate: "", endDate: "", reason: "" });

  const { data: todayData, isLoading: todayLoading } = useTodayAttendance();
  const { data: historyData, isLoading: historyLoading } = useAttendanceHistory({ limit: 10 });
  const { data: leaveBalanceData, isLoading: leaveLoading } = useLeaveBalance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const requestLeave = useRequestLeave();

  const todayRecord = todayData?.data;
  const historyRecords = historyData?.data ?? [];
  const leaveBalance = leaveBalanceData?.data;
  const leaveRequests: Array<{ type: string; dates: string; days: number; status: keyof typeof leaveStatusBadge; note: string }> = [];
  const teamAttendance: Array<{ name: string; checkIn: string; checkOut: string; hours: string; status: string; location: string }> = [];
  const pendingLeaveReviews: Array<{ member: string; type: string; dates: string; days: number; reason: string }> = [];

  const today = new Date();
  const alreadyCheckedIn = !!todayRecord?.checkInTime;
  const alreadyCheckedOut = !!todayRecord?.checkOutTime;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekdayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const calendarStatusByDay = new Map<number, string>();

  for (const row of historyRecords) {
    const d = new Date(row.date);
    if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) continue;
    const day = d.getDate();
    if (row.status === "present") calendarStatusByDay.set(day, "present");
    else if (row.status === "absent") calendarStatusByDay.set(day, "absent");
    else if (row.status === "half_day") calendarStatusByDay.set(day, "halfday");
    else if (row.status === "on_leave") calendarStatusByDay.set(day, "leave");
  }

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(currentYear, currentMonth, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = date.toDateString() === today.toDateString();
    const isFuture = date > today;

    let status = "present";
    if (isFuture) status = "future";
    else if (isToday) status = "today";
    else if (calendarStatusByDay.has(day)) status = calendarStatusByDay.get(day)!;
    else if (isWeekend) status = "weekend";
    else status = "absent";

    return { day, status };
  });
  const calendarCells = [
    ...Array.from({ length: firstWeekdayOfMonth }, () => null),
    ...calendarDays,
  ];

  const presentCount = calendarDays.filter((d) => d.status === "present").length;
  const absentCount = calendarDays.filter((d) => d.status === "absent").length;
  const leaveCount = calendarDays.filter((d) => d.status === "leave").length;
  const halfDayCount = calendarDays.filter((d) => d.status === "halfday").length;
  const worked = historyRecords.filter((r) => typeof r.workHours === "number" && r.workHours > 0).map((r) => r.workHours as number);
  const avgHours = worked.length > 0 ? worked.reduce((a, b) => a + b, 0) / worked.length : 0;
  const avgHoursLabel = worked.length > 0 ? `${Math.floor(avgHours)}h ${Math.round((avgHours % 1) * 60)}m` : "-";
  const currentMonthLabel = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const previousMonthLabel = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const teamPresentCount = teamAttendance.filter((r) => r.status.toLowerCase() === "present").length;
  const teamAbsentCount = teamAttendance.filter((r) => r.status.toLowerCase() === "absent").length;
  const teamLeaveCount = teamAttendance.filter((r) => ["leave", "on leave"].includes(r.status.toLowerCase())).length;
  const teamTotalCount = teamAttendance.length;

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const payload = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, notes: checkInNotes || undefined };
          const fn = checkInMode === "in" ? checkIn : checkOut;
          fn.mutate(payload, { onSuccess: () => { setShowCheckInModal(false); setCheckInNotes(""); } });
        },
        () => {
          const payload = { latitude: 28.6139, longitude: 77.2090, notes: checkInNotes || undefined };
          const fn = checkInMode === "in" ? checkIn : checkOut;
          fn.mutate(payload, { onSuccess: () => { setShowCheckInModal(false); setCheckInNotes(""); } });
        }
      );
    }
  };

  const handleLeaveRequest = () => {
    requestLeave.mutate(
      { type: leaveForm.type, startDate: leaveForm.startDate, endDate: leaveForm.endDate, reason: leaveForm.reason || undefined },
      { onSuccess: () => { setShowLeaveModal(false); setLeaveForm({ type: "", startDate: "", endDate: "", reason: "" }); } }
    );
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Attendance</h1>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="my" className="flex-1 sm:flex-none text-xs sm:text-sm">My Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="flex-1 sm:flex-none text-xs sm:text-sm">Leave</TabsTrigger>
          <TabsTrigger value="team" className="flex-1 sm:flex-none text-xs sm:text-sm">Team</TabsTrigger>
        </TabsList>

        {/* My Attendance */}
        <TabsContent value="my">
          {/* Today's Status */}
          <Card className="mb-6">
            <CardContent className="p-5">
              {todayLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm sm:text-base font-semibold">📅 {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Check In: </span>
                        <span className="font-medium text-success">
                          {todayRecord?.checkInTime ? `✅ ${new Date(todayRecord.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "─ Not yet"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check Out: </span>
                        <span className="font-medium">
                          {todayRecord?.checkOutTime ? new Date(todayRecord.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "─ Not yet"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hours: </span>
                        <span className="font-medium">
                          {todayRecord?.workHours ? `${Math.floor(todayRecord.workHours)}h ${Math.round((todayRecord.workHours % 1) * 60)}m` : "─"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status: </span>
                        <Badge className="bg-success text-success-foreground capitalize">{todayRecord?.status ?? "Not recorded"}</Badge>
                      </div>
                    </div>
                    {todayRecord?.checkInLocation?.address && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {todayRecord.checkInLocation.address}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!alreadyCheckedIn && (
                      <Button onClick={() => { setCheckInMode("in"); setShowCheckInModal(true); }}>
                        <Clock className="h-4 w-4 mr-2" /> Check In
                      </Button>
                    )}
                    {alreadyCheckedIn && !alreadyCheckedOut && (
                      <Button onClick={() => { setCheckInMode("out"); setShowCheckInModal(true); }}>
                        <Clock className="h-4 w-4 mr-2" /> Check Out
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3>Monthly Summary</h3>
            <Select defaultValue="current">
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="current">{currentMonthLabel}</SelectItem>
                <SelectItem value="previous">{previousMonthLabel}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
            <StatCard title="Present" value={String(presentCount)} icon={<CheckCircle className="h-5 w-5 text-[hsl(var(--success))]" />} />
            <StatCard title="Absent" value={String(absentCount)} icon={<XCircle className="h-5 w-5 text-destructive" />} />
            <StatCard title="Leave" value={String(leaveCount)} icon={<span className="text-lg">🟠</span>} />
            <StatCard title="Half Day" value={String(halfDayCount)} icon={<span className="text-lg">🟡</span>} />
            <StatCard title="Avg Hours" value={avgHoursLabel} icon={<Clock className="h-5 w-5 text-[hsl(var(--info))]" />} />
          </div>

          {/* Calendar */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-[10px] sm:text-[11px] font-medium text-muted-foreground text-center py-1">
                    {d}
                  </div>
                ))}
                {calendarCells.map((d, idx) => (
                  <div
                    key={d ? d.day : `empty-${idx}`}
                    className={`h-8 sm:h-10 rounded-md border text-xs sm:text-sm flex items-center justify-center relative ${
                      !d ? "border-transparent" :
                      d.status === "today" ? "border-primary/40 bg-primary/10 text-primary font-semibold" :
                      d.status === "weekend" ? "border-border/60 text-muted-foreground" :
                      d.status === "future" ? "border-border/50 text-muted-foreground/60" :
                      "border-border/70 text-foreground"
                    }`}
                  >
                    {d?.day ?? ""}
                    {d && d.status !== "future" && d.status !== "weekend" && d.status !== "today" && (
                      <span
                        className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                          d.status === "present" ? "bg-[hsl(var(--success))]" :
                          d.status === "absent" ? "bg-destructive" :
                          d.status === "halfday" ? "bg-[hsl(var(--warning))]" :
                          "bg-[hsl(var(--priority-high))]"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" /> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Absent</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(var(--warning))]" /> Half-day</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(var(--priority-high))]" /> Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Today</span>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Attendance History</CardTitle></CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <div className="grid grid-cols-[100px_90px_90px_70px_90px_120px] gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase min-w-[580px]">
                    <span>Date</span><span>Check In</span><span>Check Out</span><span>Hours</span><span>Status</span><span>Location</span>
                  </div>
                  {historyRecords.length === 0 ? (
                    <p className="text-center py-6 text-sm text-muted-foreground">No history available</p>
                  ) : historyRecords.map((row) => (
                    <div key={row.id} className="grid grid-cols-[100px_90px_90px_70px_90px_120px] gap-4 px-4 py-2.5 border-b last:border-b-0 text-sm items-center min-w-[580px]">
                      <span>{new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <span>{row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "─"}</span>
                      <span>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "─"}</span>
                      <span>{row.workHours ? `${Math.floor(row.workHours)}h ${Math.round((row.workHours % 1) * 60)}m` : "─"}</span>
                      <Badge variant="outline" className={
                        row.status === "present" ? "border-success text-success" :
                        row.status === "absent" ? "border-destructive text-destructive" :
                        row.status === "half_day" ? "border-warning text-warning" :
                        "border-muted text-muted-foreground"
                      }>{row.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Badge>
                      <span className="text-muted-foreground truncate">{row.checkInLocation?.address ?? "─"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Management */}
        <TabsContent value="leave">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3>Leave Balance</h3>
            <Button onClick={() => setShowLeaveModal(true)} size="sm">Apply for Leave</Button>
          </div>

          {leaveLoading ? (
            <Skeleton className="h-32 w-full mb-6" />
          ) : leaveBalance ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {(Object.entries(leaveBalance) as [string, { used: number; total?: number }][]).map(([type, bal]) => (
                <Card key={type}>
                  <CardContent className="p-4">
                    <span className="text-sm font-medium capitalize">{type.replace(/_/g, " ")}</span>
                    {bal.total !== undefined ? (
                      <>
                        <Progress value={(bal.used / bal.total) * 100} className="h-2 my-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Available: {bal.total - bal.used}</span>
                          <span>Used: {bal.used}/{bal.total}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Used: {bal.used} / ∞</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">No leave balance data</p>
          )}

          <h3 className="mb-3">My Leave Requests</h3>
          <div className="border rounded-lg overflow-x-auto">
            <div className="grid grid-cols-[80px_120px_60px_90px_1fr] gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase min-w-[440px]">
              <span>Type</span><span>Dates</span><span>Days</span><span>Status</span><span>Note</span>
            </div>
            {leaveRequests.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">No leave requests yet</p>
            ) : leaveRequests.map((lr, i) => (
              <div key={i} className="grid grid-cols-[80px_120px_60px_90px_1fr] gap-4 px-4 py-2.5 border-b last:border-b-0 text-sm items-center min-w-[440px]">
                <span>{lr.type}</span>
                <span>{lr.dates}</span>
                <span>{lr.days}</span>
                <Badge className={leaveStatusBadge[lr.status].className}>{leaveStatusBadge[lr.status].label}</Badge>
                <span className="text-muted-foreground text-sm truncate">{lr.note}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Team Attendance */}
        <TabsContent value="team">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="current">
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">{currentMonthLabel}</SelectItem>
                  <SelectItem value="previous">{previousMonthLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowManualModal(true)}>+ Manual Entry</Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <StatCard title="Present" value={String(teamPresentCount)} icon={<CheckCircle className="h-5 w-5 text-[hsl(var(--success))]" />} />
            <StatCard title="Absent" value={String(teamAbsentCount)} icon={<XCircle className="h-5 w-5 text-destructive" />} />
            <StatCard title="On Leave" value={String(teamLeaveCount)} icon={<span className="text-lg">🟠</span>} />
            <StatCard title="Total" value={String(teamTotalCount)} icon={<span className="text-lg">👥</span>} />
          </div>

          <div className="border rounded-lg mb-6 overflow-x-auto">
            <div className="grid grid-cols-[1fr_90px_90px_70px_80px_100px] gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase min-w-[520px]">
              <span>Name</span><span>Check In</span><span>Check Out</span><span>Hours</span><span>Status</span><span>Location</span>
            </div>
            {teamAttendance.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">Team attendance data is not available for your role yet</p>
            ) : teamAttendance.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_90px_70px_80px_100px] gap-4 px-4 py-2.5 border-b last:border-b-0 text-sm items-center min-w-[520px]">
                <span className="font-medium">{row.name}</span>
                <span>{row.checkIn}</span>
                <span>{row.checkOut}</span>
                <span>{row.hours}</span>
                <Badge variant="outline" className={row.status === "Present" ? "border-[hsl(var(--success))] text-[hsl(var(--success))]" : "border-destructive text-destructive"}>{row.status}</Badge>
                <span className="text-muted-foreground">{row.location}</span>
              </div>
            ))}
          </div>

          {/* Pending Leave Reviews */}
          <h3 className="mb-3">Pending Leave Requests ({pendingLeaveReviews.length})</h3>
          <div className="border rounded-lg overflow-x-auto">
            <div className="grid grid-cols-[1fr_80px_100px_60px_1fr_80px] gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase min-w-[520px]">
              <span>Member</span><span>Type</span><span>Dates</span><span>Days</span><span>Reason</span><span>Action</span>
            </div>
            {pendingLeaveReviews.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">No pending leave reviews</p>
            ) : pendingLeaveReviews.map((lr, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_60px_1fr_80px] gap-4 px-4 py-2.5 border-b last:border-b-0 text-sm items-center min-w-[520px]">
                <span className="font-medium">{lr.member}</span>
                <span>{lr.type}</span>
                <span>{lr.dates}</span>
                <span>{lr.days}</span>
                <span className="text-muted-foreground truncate">{lr.reason}</span>
                <Button size="sm" variant="outline" onClick={() => setShowReviewModal(true)}>Review</Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Check In/Out Modal */}
      <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{checkInMode === "in" ? "Check In for Today" : "Check Out"}</DialogTitle>
            <DialogDescription>{today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Location will be captured automatically</span>
              </div>
              <p className="text-xs text-muted-foreground">Browser location permission required</p>
            </div>
            {checkInMode === "out" && todayRecord?.checkInTime && (
              <div className="text-sm">
                <p>Today's Check-In: <strong>{new Date(todayRecord.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong></p>
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Input placeholder="Add a note..." className="mt-1" value={checkInNotes} onChange={(e) => setCheckInNotes(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" /> Current Time: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
            <Button onClick={handleCheckIn} disabled={checkIn.isPending || checkOut.isPending}>
              {(checkIn.isPending || checkOut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {checkInMode === "in" ? "✅ Check In" : "✅ Check Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Leave Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a leave request for review</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Leave Type *</Label>
              <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select leave type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">🤒 Sick Leave</SelectItem>
                  <SelectItem value="casual">😊 Casual Leave</SelectItem>
                  <SelectItem value="earned">🏖 Earned Leave</SelectItem>
                  <SelectItem value="unpaid">💸 Unpaid Leave</SelectItem>
                  <SelectItem value="maternity">🤱 Maternity Leave</SelectItem>
                  <SelectItem value="paternity">👶 Paternity Leave</SelectItem>
                  <SelectItem value="bereavement">🙏 Bereavement Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>From *</Label><Input type="date" className="mt-1" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} /></div>
              <div><Label>To *</Label><Input type="date" className="mt-1" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} /></div>
            </div>
            <div><Label>Reason</Label><Textarea placeholder="Reason for leave..." className="mt-1" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
            <Button
              onClick={handleLeaveRequest}
              disabled={!leaveForm.type || !leaveForm.startDate || !leaveForm.endDate || requestLeave.isPending}
            >
              {requestLeave.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Modal */}
      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Attendance Entry</DialogTitle>
            <DialogDescription>Enter attendance for a team member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Member *</Label><Input placeholder="Search team member..." className="mt-1" /></div>
            <div><Label>Date *</Label><Input type="date" className="mt-1" /></div>
            <div><Label>Status *</Label>
              <div className="flex gap-2 mt-1">
                {["Present", "Half Day", "Absent", "Holiday"].map((s) => (
                  <Button key={s} variant="outline" size="sm">{s}</Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Check In Time</Label><Input type="time" className="mt-1" /></div>
              <div><Label>Check Out Time</Label><Input type="time" className="mt-1" /></div>
            </div>
            <div><Label>Notes</Label><Input placeholder="Add notes..." className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualModal(false)}>Cancel</Button>
            <Button onClick={() => setShowManualModal(false)}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>
          {pendingLeaveReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave request selected for review.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div><Label>Note (optional)</Label><Input placeholder="Add a review note..." className="mt-1" /></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setShowReviewModal(false)}>Reject</Button>
            <Button className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]/90" onClick={() => setShowReviewModal(false)}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
