import { ArrowUpRight } from 'lucide-react';

const MetricCard = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex flex-col">
        <span className="text-lg font-bold text-gray-800">{value}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <ArrowUpRight size={20} className="text-gray-300" />
    </div>
  );
};

export default MetricCard;
