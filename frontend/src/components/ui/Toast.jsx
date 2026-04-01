import { create } from 'zustand';

const useToast = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration || 3000);
    return id;
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));

const Toast = ({ id, title, description, type = "default", onClose }) => {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    default: 'bg-white border-gray-200'
  }[type];

  const titleColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    default: 'text-gray-900'
  }[type];

  const descColor = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    default: 'text-gray-600'
  }[type];

  return (
    <div className={`border rounded-lg p-4 mb-2 ${bgColor}`}>
      <div className={`font-semibold ${titleColor}`}>{title}</div>
      {description && <div className={`text-sm ${descColor}`}>{description}</div>}
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} onClick={() => removeToast(toast.id)} className="cursor-pointer">
          <Toast {...toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
};

export { useToast, Toast, ToastContainer }
