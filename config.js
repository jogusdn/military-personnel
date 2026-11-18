// ==========================================
// [설정 파일] Supabase 및 관리자 보안 설정
// ==========================================

const CONFIG = {
  // 1. Supabase 프로젝트 URL
  SUPABASE_URL: "https://kvcchzmlnsfiiyhmjdxq.supabase.co",

  // 2. Supabase 익명 공개 키 (anon public key)
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2Y2Noem1sbnNmaWl5aG1qZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5NTUyNzgsImV4cCI6MjExMDUzMTI3OH0.QbzxMTuZcmLwwwLRYmx4WzrQfOk_OfOSa1PYLRbkjYQ",

  // 3. 관리자 보안 접속 비밀번호 (기본값: rok1234)
  ADMIN_PASSWORD: "rok1234"
};
