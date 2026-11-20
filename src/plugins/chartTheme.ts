/**
 * One palette for every chart in the panel. The dashboard history tiles and
 * the stats modal used to drift apart because each kept its own copy.
 */
export const chartSeriesColors = {
  upload: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: 'rgba(255, 165, 0, 0.8)',
  },
  download: {
    backgroundColor: 'rgba(0, 128, 0, 0.2)',
    borderColor: 'rgba(0, 128, 0, 0.8)',
  },
}

export const chartTheme = (dark: boolean, text: string) => ({
  text,
  gridY: dark ? '#333333' : '#88888850',
  gridX: dark ? '#333333' : '#88888850',
})
