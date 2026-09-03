import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { safeStorage } from '../utils/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[App Crash Caught by ErrorBoundary]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      safeStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Hệ Thống Đang Khởi Động Lại
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Trình duyệt của bạn đang tải dữ liệu hoặc bộ nhớ cache cần được làm mới. Vui lòng bấm vào nút bên dưới để tiếp tục.
            </p>

            {this.state.error && (
              <div className="mb-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-[11px] font-mono text-rose-400/90 overflow-x-auto max-h-28">
                {this.state.error.message || 'Lỗi không xác định'}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Làm mới bộ nhớ tạm (Cache) &amp; Vào lại</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
