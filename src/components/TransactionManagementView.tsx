// TRÍCH ĐOẠN XỬ LÝ PHÊ DUYỆT PHIẾU CỦA QUẢN LÝ
const handleApproveTransaction = (txId: string, note?: string) => {
  const targetTx = transactions.find((t) => t.id === txId);
  if (!targetTx) return;

  // 1. Cập nhật phiếu sang trạng thái APPROVED
  const updatedTx: Transaction = {
    ...targetTx,
    status: 'APPROVED',
    approverName: currentUser.fullName,
    approverEmail: currentUser.email,
    approvalDate: new Date().toISOString().split('T')[0],
    approvalNote: note || 'Đã phê duyệt nghiệm thu thực nhận tại kho',
  };

  // 2. Cập nhật giao dịch -> Kích hoạt cộng tồn kho tức thời cho các vật tư thực tế có trong phiếu
  onUpdateTransaction(updatedTx);

  showToast(`Đã duyệt thành công chứng từ ${targetTx.code}. Tồn kho đã được cập nhật thực tế!`, 'success');
};