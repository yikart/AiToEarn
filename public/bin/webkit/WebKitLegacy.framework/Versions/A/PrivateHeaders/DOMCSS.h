/*
 * Copyright (C) 2004 Apple Inc.  All rights reserved.
 * Copyright (C) 2006 Samuel Weinig <sam.weinig@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#import <WebKitLegacy/DOMCore.h>
#import <WebKitLegacy/DOMDocument.h>
#import <WebKitLegacy/DOMElement.h>
#import <WebKitLegacy/DOMObject.h>
#import <WebKitLegacy/DOMStylesheets.h>

#import <WebKitLegacy/DOMCSSCharsetRule.h>
#import <WebKitLegacy/DOMCSSFontFaceRule.h>
#import <WebKitLegacy/DOMCSSImportRule.h>
#import <WebKitLegacy/DOMCSSMediaRule.h>
#import <WebKitLegacy/DOMCSSPageRule.h>
#import <WebKitLegacy/DOMCSSPrimitiveValue.h>
#import <WebKitLegacy/DOMCSSRule.h>
#import <WebKitLegacy/DOMCSSRuleList.h>
#import <WebKitLegacy/DOMCSSStyleDeclaration.h>
#import <WebKitLegacy/DOMCSSStyleRule.h>
#import <WebKitLegacy/DOMCSSStyleSheet.h>
#import <WebKitLegacy/DOMCSSUnknownRule.h>
#import <WebKitLegacy/DOMCSSValue.h>
#import <WebKitLegacy/DOMCSSValueList.h>
#import <WebKitLegacy/DOMCounter.h>
#import <WebKitLegacy/DOMRGBColor.h>
#import <WebKitLegacy/DOMRect.h>

@interface DOMCSSStyleDeclaration (DOMCSS2Properties)
- (NSString *)azimuth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setAzimuth:(NSString *)azimuth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)background WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBackground:(NSString *)background WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)backgroundAttachment WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBackgroundAttachment:(NSString *)backgroundAttachment WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)backgroundColor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBackgroundColor:(NSString *)backgroundColor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)backgroundImage WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBackgroundImage:(NSString *)backgroundImage WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)backgroundPosition WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBackgroundPosition:(NSString *)backgroundPosition WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)backgroundRepeat WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBackgroundRepeat:(NSString *)backgroundRepeat WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)border WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorder:(NSString *)border WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderCollapse WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderCollapse:(NSString *)borderCollapse WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderColor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderColor:(NSString *)borderColor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderSpacing WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderSpacing:(NSString *)borderSpacing WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderStyle:(NSString *)borderStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderTop WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderTop:(NSString *)borderTop WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderRight WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderRight:(NSString *)borderRight WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderBottom WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderBottom:(NSString *)borderBottom WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderLeft WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderLeft:(NSString *)borderLeft WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderTopColor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderTopColor:(NSString *)borderTopColor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderRightColor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderRightColor:(NSString *)borderRightColor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderBottomColor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderBottomColor:(NSString *)borderBottomColor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderLeftColor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderLeftColor:(NSString *)borderLeftColor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderTopStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderTopStyle:(NSString *)borderTopStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderRightStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderRightStyle:(NSString *)borderRightStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderBottomStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderBottomStyle:(NSString *)borderBottomStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderLeftStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderLeftStyle:(NSString *)borderLeftStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderTopWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderTopWidth:(NSString *)borderTopWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderRightWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderRightWidth:(NSString *)borderRightWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderBottomWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderBottomWidth:(NSString *)borderBottomWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderLeftWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderLeftWidth:(NSString *)borderLeftWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)borderWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBorderWidth:(NSString *)borderWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)bottom WEBKIT_AVAILABLE_MAC(10_4);
- (void)setBottom:(NSString *)bottom WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)captionSide WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCaptionSide:(NSString *)captionSide WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)clear WEBKIT_AVAILABLE_MAC(10_4);
- (void)setClear:(NSString *)clear WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)clip WEBKIT_AVAILABLE_MAC(10_4);
- (void)setClip:(NSString *)clip WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)color WEBKIT_AVAILABLE_MAC(10_4);
- (void)setColor:(NSString *)color WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)content WEBKIT_AVAILABLE_MAC(10_4);
- (void)setContent:(NSString *)content WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)counterIncrement WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCounterIncrement:(NSString *)counterIncrement WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)counterReset WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCounterReset:(NSString *)counterReset WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)cue WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCue:(NSString *)cue WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)cueAfter WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCueAfter:(NSString *)cueAfter WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)cueBefore WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCueBefore:(NSString *)cueBefore WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)cursor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCursor:(NSString *)cursor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)direction WEBKIT_AVAILABLE_MAC(10_4);
- (void)setDirection:(NSString *)direction WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)display WEBKIT_AVAILABLE_MAC(10_4);
- (void)setDisplay:(NSString *)display WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)elevation WEBKIT_AVAILABLE_MAC(10_4);
- (void)setElevation:(NSString *)elevation WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)emptyCells WEBKIT_AVAILABLE_MAC(10_4);
- (void)setEmptyCells:(NSString *)emptyCells WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)cssFloat WEBKIT_AVAILABLE_MAC(10_4);
- (void)setCssFloat:(NSString *)cssFloat WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)font WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFont:(NSString *)font WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)fontFamily WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFontFamily:(NSString *)fontFamily WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)fontSize WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFontSize:(NSString *)fontSize WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)fontSizeAdjust WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFontSizeAdjust:(NSString *)fontSizeAdjust WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)fontStretch WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFontStretch:(NSString *)fontStretch WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)fontStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFontStyle:(NSString *)fontStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)fontVariant WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFontVariant:(NSString *)fontVariant WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)fontWeight WEBKIT_AVAILABLE_MAC(10_4);
- (void)setFontWeight:(NSString *)fontWeight WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)height WEBKIT_AVAILABLE_MAC(10_4);
- (void)setHeight:(NSString *)height WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)left WEBKIT_AVAILABLE_MAC(10_4);
- (void)setLeft:(NSString *)left WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)letterSpacing WEBKIT_AVAILABLE_MAC(10_4);
- (void)setLetterSpacing:(NSString *)letterSpacing WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)lineHeight WEBKIT_AVAILABLE_MAC(10_4);
- (void)setLineHeight:(NSString *)lineHeight WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)listStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setListStyle:(NSString *)listStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)listStyleImage WEBKIT_AVAILABLE_MAC(10_4);
- (void)setListStyleImage:(NSString *)listStyleImage WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)listStylePosition WEBKIT_AVAILABLE_MAC(10_4);
- (void)setListStylePosition:(NSString *)listStylePosition WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)listStyleType WEBKIT_AVAILABLE_MAC(10_4);
- (void)setListStyleType:(NSString *)listStyleType WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)margin WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMargin:(NSString *)margin WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)marginTop WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMarginTop:(NSString *)marginTop WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)marginRight WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMarginRight:(NSString *)marginRight WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)marginBottom WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMarginBottom:(NSString *)marginBottom WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)marginLeft WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMarginLeft:(NSString *)marginLeft WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)markerOffset WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMarkerOffset:(NSString *)markerOffset WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)marks WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMarks:(NSString *)marks WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)maxHeight WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMaxHeight:(NSString *)maxHeight WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)maxWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMaxWidth:(NSString *)maxWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)minHeight WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMinHeight:(NSString *)minHeight WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)minWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setMinWidth:(NSString *)minWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)orphans WEBKIT_AVAILABLE_MAC(10_4);
- (void)setOrphans:(NSString *)orphans WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)outline WEBKIT_AVAILABLE_MAC(10_4);
- (void)setOutline:(NSString *)outline WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)outlineColor WEBKIT_AVAILABLE_MAC(10_4);
- (void)setOutlineColor:(NSString *)outlineColor WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)outlineStyle WEBKIT_AVAILABLE_MAC(10_4);
- (void)setOutlineStyle:(NSString *)outlineStyle WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)outlineWidth WEBKIT_AVAILABLE_MAC(10_4);
- (void)setOutlineWidth:(NSString *)outlineWidth WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)overflow WEBKIT_AVAILABLE_MAC(10_4);
- (void)setOverflow:(NSString *)overflow WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)padding WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPadding:(NSString *)padding WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)paddingTop WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPaddingTop:(NSString *)paddingTop WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)paddingRight WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPaddingRight:(NSString *)paddingRight WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)paddingBottom WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPaddingBottom:(NSString *)paddingBottom WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)paddingLeft WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPaddingLeft:(NSString *)paddingLeft WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)page WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPage:(NSString *)page WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pageBreakAfter WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPageBreakAfter:(NSString *)pageBreakAfter WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pageBreakBefore WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPageBreakBefore:(NSString *)pageBreakBefore WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pageBreakInside WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPageBreakInside:(NSString *)pageBreakInside WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pause WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPause:(NSString *)pause WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pauseAfter WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPauseAfter:(NSString *)pauseAfter WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pauseBefore WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPauseBefore:(NSString *)pauseBefore WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pitch WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPitch:(NSString *)pitch WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)pitchRange WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPitchRange:(NSString *)pitchRange WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)playDuring WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPlayDuring:(NSString *)playDuring WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)position WEBKIT_AVAILABLE_MAC(10_4);
- (void)setPosition:(NSString *)position WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)quotes WEBKIT_AVAILABLE_MAC(10_4);
- (void)setQuotes:(NSString *)quotes WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)richness WEBKIT_AVAILABLE_MAC(10_4);
- (void)setRichness:(NSString *)richness WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)right WEBKIT_AVAILABLE_MAC(10_4);
- (void)setRight:(NSString *)right WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)size WEBKIT_AVAILABLE_MAC(10_4);
- (void)setSize:(NSString *)size WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)speak WEBKIT_AVAILABLE_MAC(10_4);
- (void)setSpeak:(NSString *)speak WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)speakHeader WEBKIT_AVAILABLE_MAC(10_4);
- (void)setSpeakHeader:(NSString *)speakHeader WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)speakNumeral WEBKIT_AVAILABLE_MAC(10_4);
- (void)setSpeakNumeral:(NSString *)speakNumeral WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)speakPunctuation WEBKIT_AVAILABLE_MAC(10_4);
- (void)setSpeakPunctuation:(NSString *)speakPunctuation WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)speechRate WEBKIT_AVAILABLE_MAC(10_4);
- (void)setSpeechRate:(NSString *)speechRate WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)stress WEBKIT_AVAILABLE_MAC(10_4);
- (void)setStress:(NSString *)stress WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)tableLayout WEBKIT_AVAILABLE_MAC(10_4);
- (void)setTableLayout:(NSString *)tableLayout WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)textAlign WEBKIT_AVAILABLE_MAC(10_4);
- (void)setTextAlign:(NSString *)textAlign WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)textDecoration WEBKIT_AVAILABLE_MAC(10_4);
- (void)setTextDecoration:(NSString *)textDecoration WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)textIndent WEBKIT_AVAILABLE_MAC(10_4);
- (void)setTextIndent:(NSString *)textIndent WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)textShadow WEBKIT_AVAILABLE_MAC(10_4);
- (void)setTextShadow:(NSString *)textShadow WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)textTransform WEBKIT_AVAILABLE_MAC(10_4);
- (void)setTextTransform:(NSString *)textTransform WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)top WEBKIT_AVAILABLE_MAC(10_4);
- (void)setTop:(NSString *)top WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)unicodeBidi WEBKIT_AVAILABLE_MAC(10_4);
- (void)setUnicodeBidi:(NSString *)unicodeBidi WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)verticalAlign WEBKIT_AVAILABLE_MAC(10_4);
- (void)setVerticalAlign:(NSString *)verticalAlign WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)visibility WEBKIT_AVAILABLE_MAC(10_4);
- (void)setVisibility:(NSString *)visibility WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)voiceFamily WEBKIT_AVAILABLE_MAC(10_4);
- (void)setVoiceFamily:(NSString *)voiceFamily WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)volume WEBKIT_AVAILABLE_MAC(10_4);
- (void)setVolume:(NSString *)volume WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)whiteSpace WEBKIT_AVAILABLE_MAC(10_4);
- (void)setWhiteSpace:(NSString *)whiteSpace WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)widows WEBKIT_AVAILABLE_MAC(10_4);
- (void)setWidows:(NSString *)widows WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)width WEBKIT_AVAILABLE_MAC(10_4);
- (void)setWidth:(NSString *)width WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)wordSpacing WEBKIT_AVAILABLE_MAC(10_4);
- (void)setWordSpacing:(NSString *)wordSpacing WEBKIT_AVAILABLE_MAC(10_4);
- (NSString *)zIndex WEBKIT_AVAILABLE_MAC(10_4);
- (void)setZIndex:(NSString *)zIndex WEBKIT_AVAILABLE_MAC(10_4);
@end
