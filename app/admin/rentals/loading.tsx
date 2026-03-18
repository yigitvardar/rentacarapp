export default function AdminRentalsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded-lg" />
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-8 w-20 bg-gray-100 rounded-full" />)}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}
