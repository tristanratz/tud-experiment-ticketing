export default function MobileLockout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Desktop Required</h1>
        <p className="text-gray-700 mb-4">
          This study must be completed on a desktop or laptop computer. Mobile devices are not supported.
        </p>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-sm text-gray-700">
          Please open your study link on a desktop browser to continue.
        </div>
      </div>
    </div>
  );
}
