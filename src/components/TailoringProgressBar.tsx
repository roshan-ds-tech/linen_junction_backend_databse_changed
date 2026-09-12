import React from "react";

interface TailoringProgressBarProps {
  currentStatus: string;
  onStatusChange?: (status: string) => void;
}

const TailoringProgressBar: React.FC<TailoringProgressBarProps> = ({
  currentStatus,
  onStatusChange,
}) => {
  const statuses = [
    { name: "Order Received", icon: "fa-receipt" },
    { name: "Cutting", icon: "fa-scissors" },
    { name: "Stitching", icon: "fa-shirt" },
    { name: "Completed", icon: "fa-check-double" },
  ];

  const currentIndex = statuses.findIndex((s) => s.name === currentStatus);

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-brand-silver/20 -translate-y-1/2 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-brand-gold transition-all duration-1000 shadow-[0_0_15px_rgba(184,134,11,0.5)]"
          style={{
            width: `${Math.max(
              0,
              (currentIndex / (statuses.length - 1)) * 100,
            )}%`,
          }}
        ></div>
      </div>

      {/* Status Nodes */}
      <div className="relative flex justify-between items-center">
        {statuses.map((status, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={status.name}
              className="flex flex-col items-center group"
              onClick={() => onStatusChange?.(status.name)}
            >
              <div
                className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-700 cursor-pointer relative z-10 shadow-lg

${
  isCurrent
    ? "bg-blue-600 text-white scale-125 ring-4 ring-blue-200 shadow-2xl"
    : isCompleted
      ? "bg-green-600 text-white"
      : "bg-white text-brand-silver border-2 border-brand-silver/20"
}
`}
              >
                <i
                  className={`fa-solid ${status.icon} ${isCurrent ? "animate-pulse text-lg md:text-xl" : "text-sm md:text-base"}`}
                ></i>
                {isCurrent && (
                  <div className="absolute -inset-2 rounded-full border-2 border-brand-gold animate-ping opacity-20"></div>
                )}
              </div>
              <div className="mt-4 md:mt-6 text-center">
                <p
                  className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500

${
  isCurrent
    ? "text-blue-700"
    : isCompleted
      ? "text-green-700"
      : "text-brand-silver"
}
`}
                >
                  {status.name}
                </p>
                {isCurrent && (
                  <span className="text-[7px] md:text-[8px] font-bold text-brand-gold uppercase tracking-widest mt-1 block animate-fadeIn">
                    Active Stage
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const isDelayed = (job: any) => {
  const created = new Date(job.createdAt || Date.now());
  const now = new Date();

  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  return diffHours > 24 && job.currentStatus !== "Completed";
};

export default TailoringProgressBar;
