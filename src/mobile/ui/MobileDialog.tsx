import { showConfirmDialog, showDialog, type DialogOptions } from 'vant'

export interface MobileDialogProps {
  options: DialogOptions
}

export const MobileDialog = {
  confirm: (options: DialogOptions) => showConfirmDialog(options),
  alert: (options: DialogOptions) => showDialog(options)
}

export default MobileDialog
