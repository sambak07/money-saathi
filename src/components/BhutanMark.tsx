import AlertBadge from './AlertBadge'

import {
  BHUTAN_IDENTITY,
} from '../bhutan/bhutanIdentity'

import '../styles/bhutan-identity.css'
import '../styles/getting-started.css'

function BhutanMark() {
  return (
    <div
      className="bhutan-mark"
      aria-label="Money Saathi is made in Bhutan"
    >
      <div className="bhutan-mark-copy">
        <span
          className="bhutan-mark-symbol"
          aria-hidden="true"
        >
          BT
        </span>

        <span>
          <strong>
            {BHUTAN_IDENTITY.madeInLabel}
          </strong>

          <small>
            Ngultrum-first · Local-first
          </small>
        </span>
      </div>

      <div className="bhutan-mark-links">
        <AlertBadge />
      </div>
    </div>
  )
}

export default BhutanMark