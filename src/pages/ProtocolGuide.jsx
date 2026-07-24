import { 
  RiPlantLine, 
  RiCheckLine, 
  RiShieldCheckLine, 
  RiTimeLine, 
  RiTestTubeLine, 
  RiGlobalLine, 
  RiSparklingLine 
} from "react-icons/ri";

export default function ProtocolGuide() {
  return (
    <div style={containerStyle}>
      {/* Header Banner */}
      <div className="card-premium" style={heroCardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={heroIconWrapperStyle}>
            <RiPlantLine size={32} color="var(--primary)" />
          </div>
          <div>
            <span style={badgeStyle}>Samruddhi Organics Standard</span>
            <h1 style={{ fontSize: "26px", fontWeight: 700, marginTop: "4px" }}>
              Four-Dose Precision Nutrition Protocol
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
              Restoring soil health first, followed by phased, crop-stage-specific nutrient delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Objective & Overview */}
      <div className="card-premium" style={sectionCardStyle}>
        <h3 style={sectionTitleStyle}>Core Objectives & Philosophy</h3>
        <p style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: "1.6", marginBottom: "16px" }}>
          Instead of applying large quantities of fertilizer at once, nutrients are supplied according to the crop&apos;s growth stage and soil test results. This data-driven approach guarantees sustainable farming outcomes:
        </p>
        <div style={gridObjectivesStyle}>
          {[
            "Correct soil pH for better nutrient availability",
            "Improve soil biological activity & microbial population",
            "Increase nutrient use efficiency & minimize waste",
            "Enhance robust root development & canopy health",
            "Boost flowering, fruit set, yield, and produce quality",
            "Maintain and build long-term soil fertility"
          ].map((text, idx) => (
            <div key={idx} style={objectiveItemStyle}>
              <RiCheckLine size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "var(--text-main)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Program Timeline Grid */}
      <div className="card-premium" style={sectionCardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <RiTimeLine size={20} color="var(--primary)" />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Overall Program Timeline & Steps</h3>
        </div>

        <div style={timelineGridStyle}>
          {/* Step 1 & 2 */}
          <div style={timelineCardStyle}>
            <span style={stepBadgeStyle}>Phase 1</span>
            <h4 style={timelineCardTitleStyle}>Soil Diagnosis & pH Correction</h4>
            <p style={timelineCardDescStyle}>
              Analysis of lab reports for deficiencies, excesses, Organic Carbon, and EC. Soil reaction (pH) is corrected first using agricultural lime, dolomite, or elemental sulphur before any nutrient feeding.
            </p>
          </div>

          {/* Dose 1 */}
          <div style={timelineCardStyle}>
            <span style={stepBadgeStyle}>Dose 1 (September)</span>
            <h4 style={timelineCardTitleStyle}>Foundation & Biological Dose</h4>
            <p style={timelineCardDescStyle}>
              Builds soil structure before feeding the crop. Focuses on organic manures, neem/castor cake, and bio-inoculants (Trichoderma, PSB, Azotobacter) to activate soil life.
            </p>
          </div>

          {/* Dose 2 */}
          <div style={timelineCardStyle}>
            <span style={stepBadgeStyle}>Dose 2 (November)</span>
            <h4 style={timelineCardTitleStyle}>Vegetative Growth Dose</h4>
            <p style={timelineCardDescStyle}>
              Supports active leaf growth, enhanced photosynthesis, and stem development based on remaining nutrient gaps following Dose 1.
            </p>
          </div>

          {/* Dose 3 */}
          <div style={timelineCardStyle}>
            <span style={stepBadgeStyle}>Dose 3 (January)</span>
            <h4 style={timelineCardTitleStyle}>Yield Support Dose</h4>
            <p style={timelineCardDescStyle}>
              Targets flowering, fruit setting, and nut development using precision secondary nutrients, Boron, Zinc, and Potassium.
            </p>
          </div>

          {/* Dose 4 */}
          <div style={{ ...timelineCardStyle, gridColumn: "1 / -1" }}>
            <span style={stepBadgeStyle}>Dose 4 (April–May)</span>
            <h4 style={timelineCardTitleStyle}>Recovery & Reserve Building Dose</h4>
            <p style={timelineCardDescStyle}>
              Restores nutrients extracted by the harvest, improves root recovery, and builds nutrient reserves in the soil profile for next season&apos;s performance.
            </p>
          </div>
        </div>
      </div>

      {/* Customization Rules & AI Roadmap */}
      <div style={bottomGridStyle}>
        <div className="card-premium" style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <RiTestTubeLine size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Customization Parameters</h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            No fixed schedules are used. Every recommendation engine output uniquely adapts to:
          </p>
          <ul style={listStyle}>
            <li>Soil nutrient status (NPK, Secondary & Micronutrients)</li>
            <li>Crop type, age, area, plant count, and target yield</li>
            <li>Local climatic conditions and irrigation methods</li>
          </ul>
        </div>

        <div className="card-premium" style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <RiSparklingLine size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Future AI Enhancement</h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            Designed to scale seamlessly with data-driven machine learning models incorporating historical trends, compliance history, and weather forecasts.
          </p>
        </div>
      </div>
    </div>
  );
}

// Styles
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  maxWidth: "1200px",
  margin: "0 auto",
  paddingBottom: "40px",
};

const heroCardStyle = {
  padding: "28px 32px",
  background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(16, 185, 129, 0.05) 100%)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
};

const heroIconWrapperStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "16px",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  flexShrink: 0,
};

const badgeStyle = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "var(--primary-hover)",
  letterSpacing: "0.05em",
  background: "rgba(16, 185, 129, 0.1)",
  padding: "3px 8px",
  borderRadius: "var(--radius-full)",
};

const sectionCardStyle = {
  padding: "24px",
};

const sectionTitleStyle = {
  fontSize: "16px",
  fontWeight: 700,
  marginBottom: "12px",
  color: "var(--text-main)",
};

const gridObjectivesStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "12px",
};

const objectiveItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "var(--bg-app)",
  padding: "10px 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
};

const timelineGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const timelineCardStyle = {
  background: "var(--bg-app)",
  borderRadius: "var(--radius-md)",
  padding: "16px",
  border: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const stepBadgeStyle = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#b45309",
  background: "#fffbeb",
  padding: "2px 8px",
  borderRadius: "var(--radius-full)",
  width: "fit-content",
  border: "1px solid #fde047",
};

const timelineCardTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--text-main)",
};

const timelineCardDescStyle = {
  fontSize: "12px",
  color: "var(--text-muted)",
  lineHeight: "1.5",
};

const bottomGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "24px",
};

const listStyle = {
  margin: 0,
  paddingLeft: "18px",
  fontSize: "13px",
  color: "var(--text-main)",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginTop: "8px",
};
