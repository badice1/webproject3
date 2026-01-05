// 导入Supabase客户端创建函数
import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取Supabase URL和匿名密钥
// VITE_前缀是Vite环境变量的约定，确保它们能被客户端代码访问
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 部署问题的调试日志
// 记录Supabase配置状态，用于调试部署问题
console.log('Supabase Configuration Check:', {
  urlConfigured: !!supabaseUrl, // URL是否已配置
  urlLength: supabaseUrl?.length, // URL长度
  urlStart: supabaseUrl?.substring(0, 8), // 只记录URL的前8个字符（https://），确保安全
  keyConfigured: !!supabaseAnonKey, // 密钥是否已配置
  keyLength: supabaseAnonKey?.length // 密钥长度
});

// 检查Supabase URL和密钥是否缺失
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Missing Supabase URL or Anon Key. Please check your .env file or GitHub Secrets.');
}

// 创建并导出Supabase客户端实例
// 如果环境变量缺失，使用占位符防止立即崩溃，但API调用会失败
// 这样设计是为了在开发和部署过程中提供更好的错误信息
// 而不是让应用直接崩溃
// supabaseUrl: Supabase项目的URL
// supabaseAnonKey: Supabase项目的匿名密钥，用于客户端访问
// 这个客户端实例将用于所有与Supabase的交互，包括认证、数据库操作等
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
