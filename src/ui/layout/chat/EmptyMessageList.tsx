import { Check } from 'lucide-react';

const EmptyMessageList = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-red-600/20 to-red-700/20 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-400">Пока нет сообщений</p>
        <p className="text-gray-500 text-sm mt-2">Будьте первым, кто отправит сообщение!</p>
      </div>
    </div>
  );
};

export default EmptyMessageList;