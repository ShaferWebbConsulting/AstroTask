import { ARCHITECTURE_STAGES, ARCHITECTURE_CHECKPOINTS } from '../data/demoData.js'

/** Lightweight HTML/CSS flow diagram — deliberately avoids a heavyweight graphing library. */
export default function ArchitectureFlow({ activeProvider }) {
  return (
    <section className="panel" aria-labelledby="architecture-flow-heading">
      <h2 id="architecture-flow-heading">Data Flow &amp; Security Checkpoints</h2>
      <div className="flow" role="list">
        {ARCHITECTURE_STAGES.map((stage, index) => {
          const isProviderStage = stage.id === 'provider'
          return (
            <div className="flow__stage-group" key={stage.id}>
              <div
                role="listitem"
                className={`flow__stage ${isProviderStage && activeProvider ? 'flow__stage--active' : ''}`}
              >
                {stage.label}
                {isProviderStage && (
                  <span className="flow__provider">{activeProvider ? activeProvider : 'No task selected'}</span>
                )}
              </div>
              {index < ARCHITECTURE_STAGES.length - 1 && <span className="flow__arrow" aria-hidden="true">→</span>}
            </div>
          )
        })}
      </div>
      <div className="flow__checkpoints">
        {ARCHITECTURE_CHECKPOINTS.map((checkpoint) => (
          <span className="flow__checkpoint" key={checkpoint.id}>
            <span className="flow__checkpoint-dot" aria-hidden="true" />
            {checkpoint.label}
          </span>
        ))}
      </div>
    </section>
  )
}
