import MultiStepForm from './components/multi-step-form';

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <p className="text-default-600 text-medium" id="sandbox-message">
        <MultiStepForm />
      </p>
    </div>
  );
}
