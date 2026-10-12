import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);

    // Auto-heal if a dynamic import / chunk failed to load (common after deployments)
    const errMsg = error?.message || '';
    const isChunkFailure =
      errMsg.includes('Failed to fetch dynamically imported module') ||
      errMsg.includes('dynamically imported') ||
      errMsg.includes('Loading chunk') ||
      errMsg.includes('Importing a module script failed');

    if (isChunkFailure) {
      const lastReload = sessionStorage.getItem('hs_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('hs_chunk_reload', String(now));
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('hs_chunk_reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-center items-center px-4 py-12">
          <div className="bg-white p-8 rounded-3xl border border-[#E8E8DF] shadow-bone max-w-md w-full text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                Pembaruan Halaman Ditemukan
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                Versi terbaru dari sistem telah diperbarui. Silakan muat ulang halaman untuk melanjutkan.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3.5 px-5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
