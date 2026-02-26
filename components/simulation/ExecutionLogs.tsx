import { cn } from "@/lib/utils";

interface LogEntry {
  ruleName: string;
  status: "PASS" | "KNOCKOUT";
  inputValue: string;
  thresholdUsed: string;
}

export default function ExecutionLogs({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="space-y-3 mt-4">
      {logs.map((log, index) => (
        <div 
          key={index} 
          className={cn(
            "p-3 rounded-lg border flex justify-between items-center transition-all",
            log.status === "PASS" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
          )}
        >
          <div>
            <p className="text-sm font-semibold">{log.ruleName}</p>
            <p className="text-[10px] text-gray-500">Value: {log.inputValue} vs {log.thresholdUsed}</p>
          </div>
          <span className={cn(
            "px-2 py-1 rounded text-[10px] font-bold",
            log.status === "PASS" ? "text-green-700 bg-white" : "text-red-700 bg-white"
          )}>
            {log.status}
          </span>
        </div>
      ))}
    </div>
  );
}