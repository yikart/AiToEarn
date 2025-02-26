/*
 * Copyright (C) 2005-2024 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "ColorHash.h"
#include "GraphicsContext.h"
#include "PaintInfo.h"
#include "PopupMenuStyle.h"
#include "ScrollTypes.h"
#include "StyleColor.h"
#include "SwitchTrigger.h"
#include "ThemeTypes.h"
#include <wtf/HashMap.h>

namespace WebCore {

enum class DocumentMarkerLineStyleMode : uint8_t;

struct AttachmentLayout;
class BorderData;
class Element;
class FileList;
class FillLayer;
class HTMLInputElement;
class HTMLMeterElement;
class Icon;
class Page;
class RenderAttachment;
class RenderBox;
class RenderMeter;
class RenderObject;
class RenderProgress;
class RenderStyle;
class Settings;

class RenderTheme {
protected:
    RenderTheme();
    virtual ~RenderTheme();

public:
    // This function is to be implemented in platform-specific theme implementations to hand back the
    // appropriate platform theme.
    WEBCORE_EXPORT static RenderTheme& singleton();

    virtual void purgeCaches();

    // This method is called whenever style has been computed for an element and the appearance
    // property has been set to a value other than "none".  The theme should map in all of the appropriate
    // metrics and defaults given the contents of the style.  This includes sophisticated operations like
    // selection of control size based off the font, the disabling of appearance when CSS properties that
    // disable native appearance are set, or if the appearance is not supported by the theme.
    void adjustStyle(RenderStyle&, const Element*, const RenderStyle* userAgentAppearanceStyle);

    virtual bool canCreateControlPartForRenderer(const RenderObject&) const { return false; }
    virtual bool canCreateControlPartForBorderOnly(const RenderObject&) const { return false; }
    virtual bool canCreateControlPartForDecorations(const RenderObject&) const { return false; }
    RefPtr<ControlPart> createControlPart(const RenderObject&) const;

    void updateControlPartForRenderer(ControlPart&, const RenderObject&) const;

    // These methods are called to paint the widget as a background of the RenderObject. A widget's foreground, e.g., the
    // text of a button, is always rendered by the engine itself. The boolean return value indicates
    // whether the CSS border/background should also be painted.
    bool paint(const RenderBox&, ControlPart&, const PaintInfo&, const LayoutRect&);
    bool paint(const RenderBox&, const PaintInfo&, const LayoutRect&);
    
    bool paintBorderOnly(const RenderBox&, const PaintInfo&, const LayoutRect&);
    void paintDecorations(const RenderBox&, const PaintInfo&, const LayoutRect&);

    // The remaining methods should be implemented by the platform-specific portion of the theme, e.g.,
    // RenderThemeMac.cpp for Mac OS X.

    // These methods return the theme's extra style sheets rules, to let each platform
    // adjust the default CSS rules in html.css, quirks.css, mediaControls.css, or plugIns.css
    virtual String extraDefaultStyleSheet() { return String(); }
    virtual String extraQuirksStyleSheet() { return String(); }
    virtual String extraPlugInsStyleSheet() { return String(); }
#if ENABLE(VIDEO)
    virtual String mediaControlsStyleSheet() { return String(); }
    virtual String extraMediaControlsStyleSheet() { return String(); }
    virtual Vector<String, 2> mediaControlsScripts() { return { }; }
#if ENABLE(MODERN_MEDIA_CONTROLS)
    virtual String mediaControlsBase64StringForIconNameAndType(const String&, const String&) { return String(); }
    virtual String mediaControlsFormattedStringForDuration(double) { return String(); }
#endif // ENABLE(MODERN_MEDIA_CONTROLS)
#endif // ENABLE(VIDEO)
#if ENABLE(ATTACHMENT_ELEMENT)
    virtual String attachmentStyleSheet() const;
#endif
#if ENABLE(DATALIST_ELEMENT)
    String dataListStyleSheet() const;
#endif
#if ENABLE(INPUT_TYPE_COLOR)
    virtual String colorInputStyleSheet() const;
#endif

    virtual LayoutRect adjustedPaintRect(const RenderBox&, const LayoutRect& paintRect) const { return paintRect; }

    // A method to obtain the baseline position for a "leaf" control.  This will only be used if a baseline
    // position cannot be determined by examining child content. Checkboxes and radio buttons are examples of
    // controls that need to do this.
    virtual int baselinePosition(const RenderBox&) const;

    // A method for asking if a control is a container or not.  Leaf controls have to have some special behavior (like
    // the baseline position API above).
    bool isControlContainer(StyleAppearance) const;

    // A method asking if the control changes its tint when the window has focus or not.
    virtual bool controlSupportsTints(const RenderObject&) const { return false; }

    // Whether or not the control has been styled enough by the author to disable the native appearance.
    virtual bool isControlStyled(const RenderStyle&, const RenderStyle& userAgentStyle) const;

    // A general method asking if any control tinting is supported at all.
    virtual bool supportsControlTints() const { return false; }

    // Some controls may spill out of their containers (e.g., the check on an OS X checkbox).  When these controls repaint,
    // the theme needs to communicate this inflated rect to the engine so that it can invalidate the whole control.
    virtual void inflateRectForControlRenderer(const RenderObject&, FloatRect&) { }
    virtual void adjustRepaintRect(const RenderBox&, FloatRect&) { }

    // A method asking if the theme is able to draw the focus ring.
    virtual bool supportsFocusRing(const RenderStyle&) const;

    // A method asking if the theme's controls actually care about redrawing when hovered.
    virtual bool supportsHover() const { return false; }

    // A method asking if the platform is able to show datalist suggestions for a given input type.
    virtual bool supportsDataListUI(const AtomString&) const { return false; }

    virtual bool supportsBoxShadow(const RenderStyle&) const { return false; }

    bool useFormSemanticContext() const { return m_useFormSemanticContext; }
    void setUseFormSemanticContext(bool value) { m_useFormSemanticContext = value; }
    virtual bool supportsLargeFormControls() const { return false; }

    virtual bool searchFieldShouldAppearAsTextField(const RenderStyle&) const { return false; }

    // Text selection colors.
    WEBCORE_EXPORT Color activeSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    WEBCORE_EXPORT Color inactiveSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    virtual Color transformSelectionBackgroundColor(const Color&, OptionSet<StyleColorOptions>) const;
    Color activeSelectionForegroundColor(OptionSet<StyleColorOptions>) const;
    Color inactiveSelectionForegroundColor(OptionSet<StyleColorOptions>) const;

    // List box selection colors
    WEBCORE_EXPORT Color activeListBoxSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    WEBCORE_EXPORT Color activeListBoxSelectionForegroundColor(OptionSet<StyleColorOptions>) const;
    Color inactiveListBoxSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    Color inactiveListBoxSelectionForegroundColor(OptionSet<StyleColorOptions>) const;

    // Highlighting color for search matches.
    Color textSearchHighlightColor(OptionSet<StyleColorOptions>) const;

    // Default highlighting color for app highlights.
    Color annotationHighlightColor(OptionSet<StyleColorOptions>) const;

    Color defaultButtonTextColor(OptionSet<StyleColorOptions>) const;

    Color datePlaceholderTextColor(const Color& textColor, const Color& backgroundColor) const;

    Color documentMarkerLineColor(const RenderText&, DocumentMarkerLineStyleMode) const;

    WEBCORE_EXPORT Color focusRingColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformFocusRingColor(OptionSet<StyleColorOptions>) const { return Color::black; }
    static float platformFocusRingWidth() { return 3; }
    static float platformFocusRingOffset(float outlineWidth) { return std::max<float>(outlineWidth - platformFocusRingWidth(), 0); }
#if ENABLE(TOUCH_EVENTS)
    static Color tapHighlightColor();
    virtual Color platformTapHighlightColor() const;
#endif
    virtual void platformColorsDidChange();

    virtual std::optional<Seconds> caretBlinkInterval() const { return { 500_ms }; }

    // System fonts and colors for CSS.
    virtual Color systemColor(CSSValueID, OptionSet<StyleColorOptions>) const;

    virtual int minimumMenuListSize(const RenderStyle&) const { return 0; }

    virtual void adjustSliderThumbSize(RenderStyle&, const Element*) const { }

    virtual LengthBox popupInternalPaddingBox(const RenderStyle&) const { return { 0, 0, 0, 0 }; }
    virtual bool popupOptionSupportsTextIndent() const { return false; }
    virtual PopupMenuStyle::Size popupMenuSize(const RenderStyle&, IntRect&) const { return PopupMenuStyle::Size::Normal; }

    virtual ScrollbarWidth scrollbarWidthStyleForPart(StyleAppearance) { return ScrollbarWidth::Auto; }

    virtual Seconds animationRepeatIntervalForProgressBar(const RenderProgress&) const { return 0_s; }
    virtual Seconds animationDurationForProgressBar() const { return 0_s; }
    virtual IntRect progressBarRectForBounds(const RenderProgress&, const IntRect& bounds) const { return bounds; }

    virtual FloatSize meterSizeForBounds(const RenderMeter&, const FloatRect&) const;
    virtual bool supportsMeter(StyleAppearance) const { return false; }

#if ENABLE(DATALIST_ELEMENT)
    // Returns the threshold distance for snapping to a slider tick mark.
    virtual LayoutUnit sliderTickSnappingThreshold() const { return 0; }
    // Returns size of one slider tick mark for a horizontal track.
    // For vertical tracks we rotate it and use it. i.e. Width is always length along the track.
    virtual IntSize sliderTickSize() const = 0;
    // Returns the distance of slider tick origin from the slider track center.
    virtual int sliderTickOffsetFromTrackCenter() const = 0;
    virtual void paintSliderTicks(const RenderObject&, const PaintInfo&, const FloatRect&);
#endif

    virtual bool shouldHaveSpinButton(const HTMLInputElement&) const;
    virtual bool shouldHaveCapsLockIndicator(const HTMLInputElement&) const { return false; }

    // Functions for <select> elements.
    virtual bool delegatesMenuListRendering() const { return false; }
    virtual bool popsMenuByArrowKeys() const { return false; }
    virtual bool popsMenuBySpaceOrReturn() const { return false; }

    virtual String fileListDefaultLabel(bool multipleFilesAllowed) const;
    virtual String fileListNameForWidth(const FileList*, const FontCascade&, int width, bool multipleFilesAllowed) const;

    enum class FileUploadDecorations : bool { SingleFile, MultipleFiles };
    virtual void paintFileUploadIconDecorations(const RenderObject& /*inputRenderer*/, const RenderObject& /*buttonRenderer*/, const PaintInfo&, const IntRect&, Icon*, FileUploadDecorations) { }
    
#if ENABLE(SERVICE_CONTROLS)
    virtual IntSize imageControlsButtonSize() const { return IntSize(); }
#endif

#if ENABLE(ATTACHMENT_ELEMENT)
    virtual LayoutSize attachmentIntrinsicSize(const RenderAttachment&) const { return LayoutSize(); }
    virtual int attachmentBaseline(const RenderAttachment&) const { return -1; }
    virtual bool attachmentShouldAllowWidthToShrink(const RenderAttachment&) const { return false; }
#endif

    enum class InnerSpinButtonLayout { Vertical, HorizontalUpLeft, HorizontalUpRight };
    virtual InnerSpinButtonLayout innerSpinButtonLayout(const RenderObject&) const { return InnerSpinButtonLayout::Vertical; }

#if USE(SYSTEM_PREVIEW)
    virtual void paintSystemPreviewBadge(Image&, const PaintInfo&, const FloatRect&);
#endif
    virtual Seconds switchAnimationVisuallyOnDuration() const { return 0_s; }
    virtual Seconds switchAnimationHeldDuration() const { return 0_s; }
    float switchPointerTrackingMagnitudeProportion() const { return 0.4f; }
    virtual bool hasSwitchHapticFeedback(SwitchTrigger) const { return false; }

protected:
    OptionSet<ControlStyle::State> extractControlStyleStatesForRenderer(const RenderObject&) const;
    ControlStyle extractControlStyleForRenderer(const RenderObject&) const;

    virtual bool canPaint(const PaintInfo&, const Settings&, StyleAppearance) const { return true; }

    // The platform selection color.
    virtual Color platformActiveSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformInactiveSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformActiveSelectionForegroundColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformInactiveSelectionForegroundColor(OptionSet<StyleColorOptions>) const;

    virtual Color platformActiveListBoxSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformInactiveListBoxSelectionBackgroundColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformActiveListBoxSelectionForegroundColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformInactiveListBoxSelectionForegroundColor(OptionSet<StyleColorOptions>) const;

    virtual Color platformTextSearchHighlightColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformAnnotationHighlightColor(OptionSet<StyleColorOptions>) const;

    virtual Color platformDefaultButtonTextColor(OptionSet<StyleColorOptions>) const;

    virtual Color platformSpellingMarkerColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformDictationAlternativesMarkerColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformAutocorrectionReplacementMarkerColor(OptionSet<StyleColorOptions>) const;
    virtual Color platformGrammarMarkerColor(OptionSet<StyleColorOptions>) const;

    virtual bool supportsSelectionForegroundColors(OptionSet<StyleColorOptions>) const { return true; }
    virtual bool supportsListBoxSelectionForegroundColors(OptionSet<StyleColorOptions>) const { return true; }

    // Methods for each appearance value.
    virtual void adjustCheckboxStyle(RenderStyle&, const Element*) const;
    virtual bool paintCheckbox(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }

    virtual void adjustRadioStyle(RenderStyle&, const Element*) const;
    virtual bool paintRadio(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }

    virtual void adjustButtonStyle(RenderStyle&, const Element*) const;
    virtual bool paintButton(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }

#if ENABLE(INPUT_TYPE_COLOR)
    virtual void adjustColorWellStyle(RenderStyle&, const Element*) const;
    virtual bool paintColorWell(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }
    virtual void paintColorWellDecorations(const RenderObject&, const PaintInfo&, const FloatRect&) { }
#endif

    virtual void adjustInnerSpinButtonStyle(RenderStyle&, const Element*) const;

    virtual void adjustTextFieldStyle(RenderStyle&, const Element*) const { }
    virtual bool paintTextField(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }
    virtual void paintTextFieldDecorations(const RenderBox&, const PaintInfo&, const FloatRect&) { }

    virtual void adjustTextAreaStyle(RenderStyle&, const Element*) const { }
    virtual bool paintTextArea(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }
    virtual void paintTextAreaDecorations(const RenderBox&, const PaintInfo&, const FloatRect&) { }

    virtual void adjustMenuListStyle(RenderStyle&, const Element*) const;
    virtual bool paintMenuList(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }
    virtual void paintMenuListDecorations(const RenderObject&, const PaintInfo&, const IntRect&) { }

    virtual void adjustMenuListButtonStyle(RenderStyle&, const Element*) const { }
    virtual void paintMenuListButtonDecorations(const RenderBox&, const PaintInfo&, const FloatRect&) { }

    virtual void paintPushButtonDecorations(const RenderObject&, const PaintInfo&, const IntRect&) { }
    virtual void paintSquareButtonDecorations(const RenderObject&, const PaintInfo&, const IntRect&) { }

    virtual void adjustMeterStyle(RenderStyle&, const Element*) const;
    virtual bool paintMeter(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }

#if ENABLE(APPLE_PAY)
    virtual void adjustApplePayButtonStyle(RenderStyle&, const Element*) const { }
#endif

#if ENABLE(ATTACHMENT_ELEMENT)
    virtual bool paintAttachment(const RenderObject&, const PaintInfo&, const IntRect&) { return false; }
    virtual void paintAttachmentText(GraphicsContext&, AttachmentLayout*) { }
#endif

#if ENABLE(DATALIST_ELEMENT)
    virtual void adjustListButtonStyle(RenderStyle&, const Element*) const { }
    virtual bool paintListButton(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }
#endif
    
#if ENABLE(SERVICE_CONTROLS)
    virtual void adjustImageControlsButtonStyle(RenderStyle&, const Element*) const { }
    virtual bool paintImageControlsButton(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }
    virtual bool isImageControlsButton(const Element&) const { return false; }
#endif

    virtual void adjustProgressBarStyle(RenderStyle&, const Element*) const { }
    virtual bool paintProgressBar(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }

    virtual void adjustSliderTrackStyle(RenderStyle&, const Element*) const { }
    virtual bool paintSliderTrack(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }

    virtual void adjustSliderThumbStyle(RenderStyle&, const Element*) const;
    virtual bool paintSliderThumb(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }

    virtual void adjustSearchFieldStyle(RenderStyle&, const Element*) const { }
    virtual bool paintSearchField(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }
    virtual void paintSearchFieldDecorations(const RenderBox&, const PaintInfo&, const IntRect&) { }

    virtual void adjustSearchFieldCancelButtonStyle(RenderStyle&, const Element*) const { }
    virtual bool paintSearchFieldCancelButton(const RenderBox&, const PaintInfo&, const IntRect&) { return true; }

    virtual void adjustSearchFieldDecorationPartStyle(RenderStyle&, const Element*) const { }
    virtual bool paintSearchFieldDecorationPart(const RenderObject&, const PaintInfo&, const IntRect&) { return true; }

    virtual void adjustSearchFieldResultsDecorationPartStyle(RenderStyle&, const Element*) const { }
    virtual bool paintSearchFieldResultsDecorationPart(const RenderBox&, const PaintInfo&, const IntRect&) { return true; }

    virtual void adjustSearchFieldResultsButtonStyle(RenderStyle&, const Element*) const { }
    virtual bool paintSearchFieldResultsButton(const RenderBox&, const PaintInfo&, const IntRect&) { return true; }

    void adjustSwitchStyleDisplay(RenderStyle&) const;
    virtual void adjustSwitchStyle(RenderStyle&, const Element*) const;
    void adjustSwitchThumbOrSwitchTrackStyle(RenderStyle&) const;
    virtual bool paintSwitchThumb(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }
    virtual bool paintSwitchTrack(const RenderObject&, const PaintInfo&, const FloatRect&) { return true; }

private:
    OptionSet<ControlStyle::State> extractControlStyleStatesForRendererInternal(const RenderObject&) const;

    void adjustButtonOrCheckboxOrColorWellOrInnerSpinButtonOrRadioStyle(RenderStyle&, const Element*) const;

public:
    bool isWindowActive(const RenderObject&) const;
    bool isChecked(const RenderObject&) const;
    bool isIndeterminate(const RenderObject&) const;
    bool isEnabled(const RenderObject&) const;
    bool isFocused(const RenderObject&) const;
    bool isPressed(const RenderObject&) const;
    bool isSpinUpButtonPartPressed(const RenderObject&) const;
    bool isHovered(const RenderObject&) const;
    bool isSpinUpButtonPartHovered(const RenderObject&) const;
    bool isPresenting(const RenderObject&) const;
    bool isReadOnlyControl(const RenderObject&) const;
    bool isDefault(const RenderObject&) const;
#if ENABLE(DATALIST_ELEMENT)
    bool hasListButton(const RenderObject&) const;
    bool hasListButtonPressed(const RenderObject&) const;
#endif

protected:
    struct ColorCache {
        UncheckedKeyHashMap<int, Color> systemStyleColors;

        Color systemLinkColor;
        Color systemActiveLinkColor;
        Color systemVisitedLinkColor;
        Color systemFocusRingColor;
        Color systemControlAccentColor;

        Color activeSelectionBackgroundColor;
        Color inactiveSelectionBackgroundColor;
        Color activeSelectionForegroundColor;
        Color inactiveSelectionForegroundColor;

        Color activeListBoxSelectionBackgroundColor;
        Color inactiveListBoxSelectionBackgroundColor;
        Color activeListBoxSelectionForegroundColor;
        Color inactiveListBoxSelectionForegroundColor;

        Color textSearchHighlightColor;
        Color annotationHighlightColor;

        Color defaultButtonTextColor;

        Color spellingMarkerColor;
        Color dictationAlternativesMarkerColor;
        Color autocorrectionReplacementMarkerColor;
        Color grammarMarkerColor;
    };

    virtual ColorCache& colorCache(OptionSet<StyleColorOptions>) const;

    virtual Color autocorrectionReplacementMarkerColor(const RenderText&) const;

private:
    StyleAppearance autoAppearanceForElement(RenderStyle&, const Element*) const;
    StyleAppearance adjustAppearanceForElement(RenderStyle&, const Element*, StyleAppearance) const;

    Color spellingMarkerColor(OptionSet<StyleColorOptions>) const;
    Color dictationAlternativesMarkerColor(OptionSet<StyleColorOptions>) const;
    Color grammarMarkerColor(OptionSet<StyleColorOptions>) const;

    mutable UncheckedKeyHashMap<uint8_t, ColorCache, DefaultHash<uint8_t>, WTF::UnsignedWithZeroKeyHashTraits<uint8_t>> m_colorCacheMap;

    bool m_useFormSemanticContext { false };
};

} // namespace WebCore
