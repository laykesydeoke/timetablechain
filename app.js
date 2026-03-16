// Slot Events module
async function emitSlotEvent(type, slotId) {
  return await contract.call('emit-slot-event', [type, slotId]);
}
