var CONFIG = {
  fontFamily: 'Cambria',
  bodyFontSize: 11,
  bodyColor: '#000000',

  headingColor: '#4b4d9f',
  h1Color: '#4b4d9f',
  h2Color: '#4b4d9f',
  h3Color: '#4b4d9f',

  h1Size: 16,
  h2Size: 14,
  h3Size: 12,

  h1Bold: true,
  h2Bold: true,
  h3Bold: true,

  h1Underline: false,
  h2Underline: false,
  h3Underline: false,

  tableHeaderBg: '#46bdc6',
  tableBorderColor: '#000000',
  tableBorderWidth: 0.5,
  tableWidthPadding: 10,
  forceTableBordersWithDocsApi: false,

  imageBlockSpacingBefore: 10,
  imageBlockSpacingAfter: 10,
  largeProtectedImageMinWidthFraction: 0.45,
  largeProtectedImageMinHeight: 140,

  upscaleSmallImages: false,
  formatStandaloneLandscapeImages: true,
  resizeStandaloneImagesToTextWidth: true,
  skipPortraitImages: true,
  skipGroupedImages: true,
  skipWrappedPositionedImages: true,
  standaloneLandscapeMinRatio: 1.25,
  portraitMaxRatio: 0.85,
  mixedInlineMinWidthFraction: 0.55,

  enableFootnotes: true,
  footnotePlaceholderMode: true,
  footnoteFontSize: 9,
  footnoteFontFamily: null, // fallback to body font
  footnoteColor: null,       // fallback to body color
  addHeaderLogo: false,
  headerLogoDriveFileId: '1V7KF-brsOG4qKXBGbNAFRnL1Pgf9UNLK',
  headerLogoWidth: 90,
  headerLogoHeight: null,
  headerLogoLeftOffset: 430,
  headerLogoTopOffset: -10
};

var H1_KEYWORDS = [
  'executive summary', 'executive',
  'section', 'introduction', 'background',
  'conclusion', 'appendix', 'overview',
  'summary', 'references', 'abstract', 'chapter'
];

function mergeConfig_(base, overrides) {
  var out = {};
  var k;

  for (k in base) out[k] = base[k];
  for (k in overrides) out[k] = overrides[k];

  if (!out.h1Color) out.h1Color = out.headingColor || '#4b4d9f';
  if (!out.h2Color) out.h2Color = out.headingColor || '#4b4d9f';
  if (!out.h3Color) out.h3Color = out.headingColor || '#4b4d9f';

  if (typeof out.formatStandaloneLandscapeImages === 'undefined') out.formatStandaloneLandscapeImages = true;
  if (typeof out.resizeStandaloneImagesToTextWidth === 'undefined') out.resizeStandaloneImagesToTextWidth = true;
  if (typeof out.skipPortraitImages === 'undefined') out.skipPortraitImages = true;
  if (typeof out.skipGroupedImages === 'undefined') out.skipGroupedImages = true;
  if (typeof out.skipWrappedPositionedImages === 'undefined') out.skipWrappedPositionedImages = true;
  if (typeof out.standaloneLandscapeMinRatio === 'undefined') out.standaloneLandscapeMinRatio = 1.25;
  if (typeof out.portraitMaxRatio === 'undefined') out.portraitMaxRatio = 0.85;
  if (typeof out.mixedInlineMinWidthFraction === 'undefined') out.mixedInlineMinWidthFraction = 0.55;
  if (typeof out.imageBlockSpacingBefore === 'undefined') out.imageBlockSpacingBefore = 10;
  if (typeof out.imageBlockSpacingAfter === 'undefined') out.imageBlockSpacingAfter = 10;
  if (typeof out.largeProtectedImageMinWidthFraction === 'undefined') out.largeProtectedImageMinWidthFraction = 0.45;
  if (typeof out.largeProtectedImageMinHeight === 'undefined') out.largeProtectedImageMinHeight = 140;
  if (typeof out.enableFootnotes === 'undefined') out.enableFootnotes = true;
  if (typeof out.footnotePlaceholderMode === 'undefined') out.footnotePlaceholderMode = true;
  if (typeof out.addHeaderLogo === 'undefined') out.addHeaderLogo = false;
  if (typeof out.headerLogoDriveFileId === 'undefined') out.headerLogoDriveFileId = '1V7KF-brsOG4qKXBGbNAFRnL1Pgf9UNLK';
  if (typeof out.headerLogoWidth === 'undefined') out.headerLogoWidth = 90;
  if (typeof out.headerLogoHeight === 'undefined') out.headerLogoHeight = null;
  if (typeof out.headerLogoLeftOffset === 'undefined') out.headerLogoLeftOffset = 430;
  if (typeof out.headerLogoTopOffset === 'undefined') out.headerLogoTopOffset = -10;
  if (typeof out.forceTableBordersWithDocsApi === 'undefined') out.forceTableBordersWithDocsApi = false;
  

  return out;
}
