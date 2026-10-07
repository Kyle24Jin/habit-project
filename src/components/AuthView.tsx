import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import './AuthView.css';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          onSuccess();
        } else {
          setInfoMsg('注册成功！若开启了邮箱验证，请查收邮件点击确认后登录。如无需验证即可直接点击下方登录。');
          setMode('signin');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' ? '邮箱或密码错误，请重试' : error.message);
        } else {
          onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '网络连接异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-logo-badge">
          <Sparkles size={28} color="#007AFF" />
        </div>
        <h2 className="auth-title">Habit Tracker</h2>
        <p className="auth-desc">登录你的云端账号，随时随地同步打卡记录</p>
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
          onClick={() => {
            setMode('signin');
            setErrorMsg(null);
          }}
        >
          账号登录
        </button>
        <button
          type="button"
          className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => {
            setMode('signup');
            setErrorMsg(null);
          }}
        >
          免费注册
        </button>
      </div>

      {errorMsg && (
        <div className="auth-alert error">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="auth-alert info">
          <span>{infoMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-input-wrap">
          <Mail size={18} className="auth-input-icon" />
          <input
            type="email"
            className="auth-input"
            placeholder="请输入电子邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-input-wrap">
          <Lock size={18} className="auth-input-icon" />
          <input
            type="password"
            className="auth-input"
            placeholder={mode === 'signup' ? '设置密码 (至少 6 位)' : '请输入密码'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          <span>{loading ? '正在处理中...' : mode === 'signin' ? '登 录' : '注 册 并 开 始'}</span>
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="auth-footer-tip">
        <span>⚡️ 强劲驱动于 Supabase PostgreSQL 云数据库</span>
      </div>
    </div>
  );
};
