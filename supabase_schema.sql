-- ========================================================
-- [통합 병력 인사 관리 및 출타/건강 현황 체계] Supabase DB 스키마
-- Supabase 대시보드 -> [SQL Editor] -> [New query]에 붙여넣고 [Run]을 누르세요.
-- ========================================================

-- 1. 기존 테이블 초기화 (재실행 시 충돌 방지)
DROP TABLE IF EXISTS event_logs CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- 2. 대원 명부 테이블 (members) 생성
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,                    -- 대원 성명 (예: 김대한)
    rank VARCHAR(30) NOT NULL,                    -- 계급 (예: 이병, 일병, 상병, 병장, 하사, 중사, 소위, 중위)
    service_number VARCHAR(50),                   -- 군번 (예: 24-72012345)
    platoon VARCHAR(50) NOT NULL DEFAULT '1소대', -- 소속 (예: 본부, 1소대, 2소대, 3소대, 화기소대)
    role VARCHAR(50) DEFAULT '소총수',             -- 직책/보직 (예: 분대장, 소총수, 무전병, 의무병, 행정병)
    status VARCHAR(30) NOT NULL DEFAULT '현원',   -- 현재 상태 ('현원', '휴가', '외출', '외박', '환자', '열외', '기타')
    phone VARCHAR(30),                            -- 본인 연락처
    emergency_phone VARCHAR(30),                  -- 보호자/비상 연락처
    notes TEXT,                                   -- 특이사항 / 비고 (예: A형, 발목수술 이력 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 출타 및 환자/사고 기록 테이블 (event_logs) 생성 (외래키 연결)
CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE, -- members 테이블 id 참조 (외래키)
    event_type VARCHAR(30) NOT NULL,              -- 구분 ('휴가', '외출', '외박', '환자', '열외', '기타')
    sub_type VARCHAR(50),                         -- 세부구분 (예: 정기휴가, 포상휴가, 외진, 입원 등)
    start_date DATE NOT NULL,                     -- 시작일 (YYYY-MM-DD)
    end_date DATE NOT NULL,                       -- 종료일 (YYYY-MM-DD)
    destination VARCHAR(100),                     -- 행선지 / 병원 (예: 서울 강남구 자택, 국군춘천병원)
    reason TEXT,                                  -- 사유 / 병명 (예: 정기 2차 휴가, 사랑니 발치 외진)
    status VARCHAR(30) NOT NULL DEFAULT '진행중', -- 상태 ('진행중', '복귀완료')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 인덱스 생성 (조회 성능 최적화)
CREATE INDEX idx_members_platoon ON members(platoon);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_event_logs_member_id ON event_logs(member_id);
CREATE INDEX idx_event_logs_dates ON event_logs(start_date, end_date);

-- 5. 보안 및 권한 설정 (Row Level Security - RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access to members" 
ON members FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public full access to event_logs" 
ON event_logs FOR ALL 
USING (true) 
WITH CHECK (true);

-- 6. 초기 12명 부대원 샘플 데이터 입력
INSERT INTO members (name, rank, service_number, platoon, role, status, phone, notes)
VALUES 
('이민국', '중위', '23-10021', '1소대', '소대장', '현원', '010-1234-5678', '소대 총괄 지휘 (O형)'),
('박충성', '중사', '20-50142', '1소대', '부소대장', '현원', '010-2345-6789', '병력 관리 (A형)'),
('김철수', '병장', '23-720101', '1소대', '1분대장', '휴가', '010-3456-7890', '정기 2차 휴가 (특급전사)'),
('이영희', '상병', '23-720234', '1소대', '부분대장', '현원', '010-4567-8901', '사격 우수자 (B형)'),
('박민준', '상병', '23-720311', '1소대', 'K-3사수', '외출', '010-5678-9012', '치과 외진 외출'),
('최동석', '일병', '24-720045', '1소대', '소총수', '현원', '010-6789-0123', '특이사항 없음 (AB형)'),
('정승우', '일병', '24-720156', '1소대', '무전병', '환자', '010-7890-1234', '우측 발목 인대 염좌 (침상안정)'),
('강태양', '일병', '24-720289', '1소대', '소총수', '외박', '010-8901-2345', '주말 성과위주 외박'),
('윤시우', '이병', '24-720401', '1소대', '유탄수', '현원', '010-9012-3456', '신병 적응 양호'),
('한도윤', '이병', '24-720512', '1소대', '의무병', '현원', '010-0123-4567', '의무실 파견 지원'),
('조현우', '상병', '23-720455', '2소대', '1분대장', '현원', '010-1122-3344', '2소대 병력'),
('임재민', '일병', '24-720198', '2소대', '소총수', '휴가', '010-2233-4455', '포상휴가(체력검정 특급)');

-- 7. 출타 및 환자 샘플 로그 등록 (PostgreSQL 날짜 표준 정수 연산 적용)
-- 김철수 병장 휴가
INSERT INTO event_logs (member_id, event_type, sub_type, start_date, end_date, destination, reason, status)
SELECT id, '휴가', '정기휴가', CURRENT_DATE - 1, CURRENT_DATE + 2, '서울 강서구 자택', '정기 2차 휴가', '진행중'
FROM members WHERE name = '김철수' LIMIT 1;

-- 박민준 상병 외출
INSERT INTO event_logs (member_id, event_type, sub_type, start_date, end_date, destination, reason, status)
SELECT id, '외출', '진료외출', CURRENT_DATE, CURRENT_DATE, '국군춘천병원', '사랑니 발치 진료', '진행중'
FROM members WHERE name = '박민준' LIMIT 1;

-- 정승우 일병 환자
INSERT INTO event_logs (member_id, event_type, sub_type, start_date, end_date, destination, reason, status)
SELECT id, '환자', '침상안정', CURRENT_DATE - 2, CURRENT_DATE + 1, '소대 생활관', '우측 발목 인대 염좌 및 열외', '진행중'
FROM members WHERE name = '정승우' LIMIT 1;

-- 강태양 일병 외박
INSERT INTO event_logs (member_id, event_type, sub_type, start_date, end_date, destination, reason, status)
SELECT id, '외박', '정기외박', CURRENT_DATE, CURRENT_DATE + 1, '강원도 춘천시 시내', '주말 성과위주 외박', '진행중'
FROM members WHERE name = '강태양' LIMIT 1;

-- 임재민 일병 휴가
INSERT INTO event_logs (member_id, event_type, sub_type, start_date, end_date, destination, reason, status)
SELECT id, '휴가', '포상휴가', CURRENT_DATE - 2, CURRENT_DATE + 1, '경기도 수원시 자택', '체력검정 특급 포상휴가', '진행중'
FROM members WHERE name = '임재민' LIMIT 1;
