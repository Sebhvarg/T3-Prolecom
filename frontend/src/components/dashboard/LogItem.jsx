const LogItem = ({ title, time, color }) => {
  return (
    <div className="flex gap-4">
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${color}`}></div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  );
};

export default LogItem;
