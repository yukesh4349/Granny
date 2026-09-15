-- ============================================================================
-- Migration 006: Traditional Game Videos & Nostalgia Media Library
-- Stores videos associated with 10 traditional heritage games for elder cognitive therapy
-- ============================================================================

-- 1. Create table for game videos
CREATE TABLE IF NOT EXISTS game_videos (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_ta TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ta TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT NOT NULL DEFAULT 'outdoor' CHECK (category IN ('outdoor', 'indoor', 'traditional', 'cinema')),
    cultural_notes TEXT,
    cultural_notes_ta TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE game_videos ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy for elders and caregivers
DROP POLICY IF EXISTS "Public read game videos" ON game_videos;
CREATE POLICY "Public read game videos" ON game_videos
FOR SELECT USING (true);

-- 4. Caregiver / Admin manage policy
DROP POLICY IF EXISTS "Caregivers insert update game videos" ON game_videos;
CREATE POLICY "Caregivers insert update game videos" ON game_videos
FOR ALL USING (true);

-- 5. Seed all 10 heritage game videos
INSERT INTO game_videos (id, game_key, title, title_ta, description, description_ta, video_url, category, cultural_notes, cultural_notes_ta)
VALUES
(
    'vid_gilli_danda',
    'gilli_danda',
    'Gilli Danda (கிட்டிப்புல்)',
    'கிட்டிப்புல் பாரம்பரிய விளையாட்டு',
    'Traditional street game of striking a tapered wooden peg with a long stick across open fields.',
    'கிராமத்து தெருக்களில் சிறுவர்களால் ஆவலுடன் விளையாடப்பட்ட பாரம்பரிய கிட்டிப்புல் விளையாட்டு.',
    '/videos/Gilli-Danda.mp4',
    'outdoor',
    'Strengthens hand-eye coordination, trajectory estimation, and quick reflexes.',
    'கை-கண் ஒருங்கிணைப்பு மற்றும் விரைவான எதிர்வினைத் திறனைத் தூண்டுகிறது.'
),
(
    'vid_kabaddi',
    'kabaddi',
    'Kabaddi (சடுகுடு / கபடி)',
    'சடுகுடு / கபடி வீரம் நிறைந்த விளையாட்டு',
    'Ancient Tamil contact game requiring continuous chant, breath control, and quick evasion.',
    'ஒரே மூச்சில் "கபடி கபடி" என்று பாடி எதிரணியினரைத் தொட்டு வரும் வீர விளையாட்டு.',
    '/videos/Kabaddi.mp4',
    'outdoor',
    'Invokes energetic childhood memories of village tournaments and team bonding.',
    'கிராமப்புறத் திருவிழாக்கள் மற்றும் பள்ளிப் பருவ நினைவுகளை மீட்டெடுக்கிறது.'
),
(
    'vid_kanche',
    'kanche',
    'Kanche / Marbles (கோலி குண்டு)',
    'கோலி குண்டு விளையாட்டு நினைவுகள்',
    'Precision thumb-strike marble game played in a circle etched in the soil.',
    'மண்ணில் வட்டம் வரைந்து வண்ண வண்ண கோலி குண்டுகளை விரலால் குறிபார்த்து அடிக்கும் விளையாட்டு.',
    '/videos/Kanche.mp4',
    'outdoor',
    'Sharpens spatial positioning memory and fine motor recall.',
    'வண்ணங்களை நினைவில் நிறுத்தும் திறன் மற்றும் குறியிடும் கவனத்தை வளர்க்கிறது.'
),
(
    'vid_kite_flying',
    'pattam_viduthal',
    'Kite Flying (பட்டம் விடுதல்)',
    'பட்டம் விடுதல் வான்வெளி நினைவுகள்',
    'Soaring colorful diamond kites high in the evening breeze from village rooftops.',
    'மாலை வேளையில் மொட்டை மாடியில் நின்று வண்ணப் பட்டங்களை காற்றில் பறக்கவிடும் இன்பமான அனுபவம்.',
    '/videos/Kite-Flying.mp4',
    'outdoor',
    'Stimulates wind path planning, spatial orientation, and joyful sky gazing.',
    'திசை உணர்வு மற்றும் வான்வெளியை நோக்கும் மகிழ்ச்சியான உணர்வைத் தருகிறது.'
),
(
    'vid_nondi',
    'nondi',
    'Nondi / Hopscotch (நொண்டி விளையாட்டு)',
    'நொண்டி பாரம்பரிய கட்ட விளையாட்டு',
    'Hopscotch grid drawn with chalk or brick where players hop through numbered squares to reach the fruit.',
    'தரையிலோ தெருவிலோ கட்டங்கள் வரைந்து ஒற்றைக் காலால் தாண்டி "பழம்" தொடும் பாரம்பரிய விளையாட்டு.',
    '/videos/Nondi.mp4',
    'outdoor',
    'Promotes working memory of sequential paths and balancing rules.',
    'வரிசைமுறை நினைவாற்றல் மற்றும் உடலளவிலான சமநிலை நினைவுகளைத் தூண்டுகிறது.'
),
(
    'vid_pallanguzhi',
    'pallanguzhi',
    'Pallanguzhi (பல்லாங்குழி)',
    'பல்லாங்குழி மரப்பலகை விளையாட்டு',
    'Classic 14-pit wooden board game played with cowrie shells and tamarind seeds on verandahs.',
    'திண்ணையில் அமர்ந்து புளியங்கொட்டைகள் அல்லது சோழிகளைக் கொண்டு 14 குழிகளில் விளையாடும் பாரம்பரிய ஆட்டம்.',
    '/videos/Pallanguzhi.mp4',
    'indoor',
    'Stimulates mathematical counting, working memory, and leisurely evening reminiscing.',
    'எண்ணிக்கை கணக்கீடு மற்றும் குடும்பத்தினருடன் திண்ணையில் கழித்த மாலை நேரங்களை நினைவூட்டுகிறது.'
),
(
    'vid_street_cricket',
    'street_cricket',
    'Street Cricket (தெரு கிரிக்கெட்)',
    'தெரு கிரிக்கெட் காலத்து நினைவுகள்',
    'Gully cricket with brick wickets, tennis balls, and unique local neighbourhood rules.',
    'செங்கல் ஸ்டம்ப், டென்னிஸ் பந்துடன் சந்துகளிலும் சந்து முனைகளிலும் விளையாடிய உற்சாக கிரிக்கெட்.',
    '/videos/Street-Cricket.mp4',
    'outdoor',
    'Revives situational rule memory, social laughter, and score calculation.',
    'நண்பர்களுடன் விளையாடிய உரையாடல்கள் மற்றும் உற்சாக கணக்குகளை நினைவுகூர்கிறது.'
),
(
    'vid_thaayam',
    'thaayam',
    'Thaayam (தாயக்கட்டம் / தாயம்)',
    'தாயக்கட்டம் பித்தளை பகடை ஆட்டம்',
    'Strategic family board game with brass dice, safe castles (malai), and exciting token cutting.',
    'குடும்பமாக வட்டமாக அமர்ந்து பித்தளை தாயம் உருட்டி மலை ஏறும் உற்சாகமான பாரம்பரிய பலகை விளையாட்டு.',
    '/videos/Thayaam.mp4',
    'indoor',
    'Enhances strategic planning, safe-zone awareness, and family nostalgia.',
    'குடும்ப உறவுகள் மற்றும் பண்டிகை காலங்களில் தாயக்கட்டம் ஆடிய மகிழ்ச்சியைத் தருகிறது.'
),
(
    'vid_tyre_racing',
    'tyre_oattam',
    'Tyre Racing (டயர் ஓட்டம்)',
    'டயர் ஓட்டம் தெரு சவாரி நினைவுகள்',
    'Guiding a bicycle tyre with a wooden stick through winding sandy village lanes.',
    'சைக்கிள் பழைய டயரைக் குச்சியால் தட்டி தெருவெங்கும் ஓட்டிச் சென்ற குழந்தைப்பருவ மகிழ்ச்சி.',
    '/videos/Tyre-Racing.mp4',
    'outdoor',
    'Triggers navigation memory of childhood village paths and tea stall landmarks.',
    'கிராமத்து தெருக்கள் மற்றும் குழந்தைப்பருவ சுதந்திரமான ஓட்டத்தை நினைவூட்டுகிறது.'
),
(
    'vid_uriyadi',
    'uriyadi',
    'Uriyadi (உறியடி திருவிழா)',
    'உறியடி திருவிழா மகிழ்ச்சி நினைவுகள்',
    'Festive swinging pot strike during Krishna Jayanthi and Pongal temple celebrations.',
    'பொங்கல் மற்றும் கிருஷ்ண ஜெயந்தி திருவிழாக்களில் மேளதாளத்துடன் தொங்கும் பானையை அடித்து உடைக்கும் விளையாட்டு.',
    '/videos/Uriyadi.mp4',
    'outdoor',
    'Evokes festive temple melodies, rhythm synchronization, and community joy.',
    'கோவில் திருவிழாக்கள், மேள வாத்தியங்கள் மற்றும் பக்திப் பரவச நினைவுகளை மீட்டெடுக்கிறது.'
)
ON CONFLICT (game_key) DO UPDATE SET
    title = EXCLUDED.title,
    title_ta = EXCLUDED.title_ta,
    description = EXCLUDED.description,
    description_ta = EXCLUDED.description_ta,
    video_url = EXCLUDED.video_url,
    category = EXCLUDED.category,
    cultural_notes = EXCLUDED.cultural_notes,
    cultural_notes_ta = EXCLUDED.cultural_notes_ta,
    updated_at = NOW();
