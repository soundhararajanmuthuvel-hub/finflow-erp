import html2canvas from 'html2canvas';

export const exportElementAsJpg = async (
  element: HTMLElement,
  filename: string = 'document.jpg',
  scale: number = 2
): Promise<void> => {
  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting image:', error);
    throw new Error('Failed to generate high-resolution JPG image');
  }
};
