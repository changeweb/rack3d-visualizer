import type { IVisualizer } from '../types/visualizer'

export class VMManager {
  private viz: IVisualizer

  constructor(viz: IVisualizer) {
    this.viz = viz
  }

  renderVMPanel(dev: Record<string, unknown>): void {
    const self = this.viz
    const panel = document.querySelector(`#${self._id} [data-panel-id="vms"]`)
    if (!panel) return
    if (dev && dev.type === 'server') {
      panel.classList.remove('r3-panel-hidden')
      const body = panel.querySelector('.r3-pb')
      if (body) body.innerHTML = self._html.vmPanelBody()
    } else {
      panel.classList.add('r3-panel-hidden')
    }
  }

  hideVMPanel(): void {
    const self = this.viz
    const panel = document.querySelector(`#${self._id} [data-panel-id="vms"]`)
    if (panel) panel.classList.add('r3-panel-hidden')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDevByIdx(di: number): any {
    const self = this.viz
    return self._rack?.devices?.[di] ?? null
  }

  addVM(di: number): void {
    const self = this.viz
    const dev = this.getDevByIdx(di)
    if (!dev) return
    if (!Array.isArray(dev.vms)) dev.vms = []
    ;(dev.vms as Record<string, unknown>[]).push({
      id: 'vm-' + Date.now(),
      name: 'VM-' + ((dev.vms as unknown[]).length + 1),
      label: '',
      technology: 'KVM/QEMU',
      os: 'Ubuntu 22.04 LTS',
      status: 'stopped',
      ips: { local: '', public: '' },
      ports: [],
      resources: { vcpu: 2, memory: 2048, disk: 50 },
    })
    this.refreshVMList(di)
  }

  editVM(di: number, vi: number, field: string, value: unknown): void {
    const dev = this.getDevByIdx(di)
    const vm = (dev?.vms as Record<string, unknown>[])?.[vi]
    if (!vm) return
    vm[field] = value
    this.refreshVMCard(di, vi)
  }

  editVMNested(di: number, vi: number, obj: string, field: string, value: unknown): void {
    const dev = this.getDevByIdx(di)
    const vm = (dev?.vms as Record<string, unknown>[])?.[vi]
    if (!vm) return
    if (!vm[obj]) vm[obj] = {}
    ;(vm[obj] as Record<string, unknown>)[field] = value
    this.refreshVMCard(di, vi)
  }

  removeVM(di: number, vi: number): void {
    const dev = this.getDevByIdx(di)
    if (!dev?.vms) return
    ;(dev.vms as unknown[]).splice(vi, 1)
    this.refreshVMList(di)
  }

  addVMPort(di: number, vi: number): void {
    const dev = this.getDevByIdx(di)
    const vm = (dev?.vms as Record<string, unknown>[])?.[vi]
    if (!vm) return
    if (!Array.isArray(vm.ports)) vm.ports = []
    ;(vm.ports as Record<string, unknown>[]).push({ port: 80, protocol: 'TCP', status: 'open', service: 'HTTP' })
    this.refreshVMCard(di, vi)
  }

  editVMPort(di: number, vi: number, pi: number, field: string, value: unknown): void {
    const dev = this.getDevByIdx(di)
    const vm = (dev?.vms as Record<string, unknown>[])?.[vi]
    if (!(vm?.ports as Record<string, unknown>[])?.[pi]) return
    ;(vm!.ports as Record<string, unknown>[])[pi][field] = value
    this.refreshVMCard(di, vi)
  }

  removeVMPort(di: number, vi: number, pi: number): void {
    const dev = this.getDevByIdx(di)
    const vm = (dev?.vms as Record<string, unknown>[])?.[vi]
    if (!vm?.ports) return
    ;(vm.ports as unknown[]).splice(pi, 1)
    this.refreshVMCard(di, vi)
  }

  toggleVMEdit(di: number, vi: number): void {
    const self = this.viz
    const el = document.getElementById(self._id + `-vmef-${di}-${vi}`)
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none'
  }

  refreshVMList(di: number): void {
    const self = this.viz
    const dev = this.getDevByIdx(di)
    if (!dev) return
    const sid = self._id
    const listEl = document.getElementById(sid + '-vm-list')
    if (listEl) listEl.innerHTML = ((dev.vms as Record<string, unknown>[]) || []).map((vm, vi) => self._html.vmCard(vm, di, vi)).join('')
    const hdr = listEl?.previousElementSibling
    if (hdr) {
      const vms = (dev.vms as unknown[]) || []
      const span = hdr.querySelector('span')
      if (span) span.textContent = `${dev.name} — ${vms.length} VM${vms.length !== 1 ? 's' : ''}`
    }
    if (self._opts.onChange) self._opts.onChange(self.getData()!)
  }

  refreshVMCard(di: number, vi: number): void {
    const self = this.viz
    const dev = this.getDevByIdx(di)
    const vm = (dev?.vms as Record<string, unknown>[])?.[vi]
    if (!vm) return
    const sid = self._id
    const cardEl = document.getElementById(sid + `-vm-${di}-${vi}`)
    if (cardEl) {
      const wasOpen = document.getElementById(sid + `-vmef-${di}-${vi}`)?.style.display !== 'none'
      cardEl.outerHTML = self._html.vmCard(vm, di, vi)
      if (wasOpen) {
        const newForm = document.getElementById(sid + `-vmef-${di}-${vi}`)
        if (newForm) newForm.style.display = ''
      }
    }
    if (self._opts.onChange) self._opts.onChange(self.getData()!)
  }
}
