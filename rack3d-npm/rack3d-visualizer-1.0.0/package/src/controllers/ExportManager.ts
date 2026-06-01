import type { IVisualizer } from '../types/visualizer'

export class ExportManager {
  private viz: IVisualizer

  constructor(viz: IVisualizer) {
    this.viz = viz
  }

  getConfig(): object {
    const self = this.viz
    const sb = self._opts.sidebar
    return {
      theme: typeof self._opts.theme === 'string' ? self._opts.theme : 'dark',
      sidebar: {
        showLeft: sb.showLeft,
        showRight: sb.showRight,
        leftWidth: sb.leftWidth,
        rightWidth: sb.rightWidth,
        panelLayout: sb.panelLayout,
        roomFields: sb.roomFields,
        lightingFields: sb.lightingFields,
      },
      lighting: {
        customLights: self._opts.lighting.customLights || [],
      },
    }
  }

  copyJson(): void {
    const self = this.viz
    const json = JSON.stringify({ room: self._room, config: this.getConfig() }, null, 2)
    navigator.clipboard?.writeText(json).then(() => {
      const b = document.getElementById(self._id + '-btnCopy')
      const orig = b?.textContent
      if (b) { b.textContent = '✓ Copied!'; setTimeout(() => { if (b) b.textContent = orig ?? null }, 1500) }
    }).catch(() => {
      const ta = document.getElementById(self._id + '-jta') as HTMLTextAreaElement | null
      if (ta) {
        ta.value = json
        const jp = document.getElementById(self._id + '-jp')
        if (jp) jp.style.display = 'flex'
      }
    })
  }

  exportJson(): void {
    const self = this.viz
    const ta = document.getElementById(self._id + '-jta') as HTMLTextAreaElement | null
    if (ta) ta.value = JSON.stringify({ room: self._room, config: this.getConfig() }, null, 2)
  }

  applyJson(): void {
    const self = this.viz
    const ta = document.getElementById(self._id + '-jta') as HTMLTextAreaElement | null
    const je = document.getElementById(self._id + '-je')
    if (!ta) return
    try {
      const p = JSON.parse(ta.value)
      if (je) je.textContent = ''

      if (p.room && Array.isArray(p.room.racks)) {
        self.setRoomData(p.room)
        if (p.config) this.applyConfig(p.config)
      } else if (Array.isArray(p.racks)) {
        self.setRoomData(p)
      } else if (Array.isArray(p.rack?.devices)) {
        self.setData(p.rack)
      } else if (Array.isArray(p.devices)) {
        self.setData(p)
      } else {
        throw new Error("Missing 'racks' or 'devices' key")
      }
    } catch (e) {
      if (je) je.textContent = '⚠ ' + (e as Error).message
    }
  }

  applyConfig(cfg: Record<string, unknown>): void {
    const self = this.viz
    if (!cfg) return
    const sidebar = cfg.sidebar as Record<string, unknown> | undefined
    const lighting = cfg.lighting as Record<string, unknown> | undefined
    if (cfg.theme) self._onThemeChange(cfg.theme as string)
    if (sidebar) {
      if (sidebar.leftWidth !== undefined) {
        self._opts.sidebar.leftWidth = sidebar.leftWidth as number
        const el = document.getElementById(self._id + '-sb')
        if (el) { el.style.width = sidebar.leftWidth + 'px'; el.style.minWidth = sidebar.leftWidth + 'px' }
      }
      if (sidebar.rightWidth !== undefined) {
        self._opts.sidebar.rightWidth = sidebar.rightWidth as number
        const el = document.getElementById(self._id + '-sbr')
        if (el) { el.style.width = sidebar.rightWidth + 'px'; el.style.minWidth = sidebar.rightWidth + 'px' }
      }
      if (sidebar.showLeft !== undefined && sidebar.showLeft !== self._opts.sidebar.showLeft) self._toggleSidebarLeft()
      if (sidebar.showRight !== undefined && sidebar.showRight !== self._opts.sidebar.showRight) self._toggleSidebarRight()
      if (sidebar.panelLayout) {
        self._opts.sidebar.panelLayout = sidebar.panelLayout as { left: string[]; right: string[]; collapsed: Record<string, boolean> }
        self._restorePanelState()
      }
    }
    if (lighting?.customLights) {
      self._opts.lighting.customLights = lighting.customLights as typeof self._opts.lighting.customLights
      self._buildEnvironment()
      self._renderCustomLights()
    }
  }

  toggleJson(): void {
    const self = this.viz
    const jp = document.getElementById(self._id + '-jp')
    if (!jp) return
    const on = jp.style.display === 'none'
    jp.style.display = on ? 'flex' : 'none'
    const b = document.getElementById(self._id + '-btnJ')
    if (b) b.className = 'r3-btn' + (on ? ' on' : '')
    if (on) this.exportJson()
  }
}
