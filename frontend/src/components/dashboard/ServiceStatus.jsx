const ServiceStatus = ({ name, status }) => {
  // En un caso real, el color del punto dependería del status ("Operacional" = verde, "Falla" = rojo)
  const isOperational = status === 'Operacional';
  
  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
      <div className="flex flex-col">
        <span className="font-semibold text-gray-700">{name}</span>
        <span className={`text-xs font-medium ${isOperational ? 'text-green-600' : 'text-red-600'}`}>
          {status}
        </span>
      </div>
      <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] ${isOperational ? 'bg-green-500' : 'bg-red-500'}`}></div>
    </div>
  );
};

export default ServiceStatus;
