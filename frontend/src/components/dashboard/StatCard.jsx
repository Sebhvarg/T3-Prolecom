const StatCard = ({ label, value, icon, color, iconColor }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} ${iconColor}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
    </div>
  );
};

export default StatCard;
