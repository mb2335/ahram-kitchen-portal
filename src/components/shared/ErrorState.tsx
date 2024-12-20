interface ErrorStateProps {
  message?: string;
}

export function ErrorState({ message = "An error occurred. Please try again later." }: ErrorStateProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center text-red-600">
        {message}
      </div>
    </div>
  );
}