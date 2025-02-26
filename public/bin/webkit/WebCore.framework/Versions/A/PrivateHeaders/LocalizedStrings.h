/*
 * Copyright (C) 2003-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2010 Igalia S.L
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

#ifndef LocalizedStrings_h
#define LocalizedStrings_h

#include <wtf/Forward.h>

#ifdef __OBJC__
#include <wtf/cocoa/TypeCastsCocoa.h>
#endif

#if USE(GLIB) && defined(GETTEXT_PACKAGE)
#include <glib/gi18n-lib.h>
#endif

namespace WebCore {

    class IntSize;
    class DateComponents;

#if PLATFORM(COCOA)
    WEBCORE_EXPORT String truncatedStringForMenuItem(const String&);
#endif

    String inputElementAltText();
    String resetButtonDefaultLabel();
    String searchableIndexIntroduction();
    String submitButtonDefaultLabel();
    WEBCORE_EXPORT String fileButtonChooseFileLabel();
    WEBCORE_EXPORT String fileButtonChooseMultipleFilesLabel();
    String fileButtonNoFileSelectedLabel();
    String fileButtonNoFilesSelectedLabel();
    String defaultDetailsSummaryText();

#if PLATFORM(COCOA)
    String copyImageUnknownFileLabel();
#endif
#if ENABLE(APP_HIGHLIGHTS)
    WEBCORE_EXPORT String contextMenuItemTagAddHighlightToCurrentQuickNote();
    WEBCORE_EXPORT String contextMenuItemTagAddHighlightToNewQuickNote();
#endif
    WEBCORE_EXPORT String contextMenuItemTagCopyLinkWithHighlight();

#if ENABLE(CONTEXT_MENUS)
    WEBCORE_EXPORT String contextMenuItemTagOpenLinkInNewWindow();
    String contextMenuItemTagDownloadLinkToDisk();
    WEBCORE_EXPORT String contextMenuItemTagCopyLinkToClipboard();
    String contextMenuItemTagOpenImageInNewWindow();
    String contextMenuItemTagDownloadImageToDisk();
    String contextMenuItemTagCopyImageToClipboard();
#if PLATFORM(GTK)
    String contextMenuItemTagCopyImageURLToClipboard();
#endif
    String contextMenuItemTagOpenFrameInNewWindow();
    WEBCORE_EXPORT String contextMenuItemTagCopy();
    String contextMenuItemTagGoBack();
    String contextMenuItemTagGoForward();
    String contextMenuItemTagStop();
    String contextMenuItemTagReload();
    String contextMenuItemTagCut();
    WEBCORE_EXPORT String contextMenuItemTagPaste();
#if PLATFORM(GTK)
    String contextMenuItemTagPasteAsPlainText();
    String contextMenuItemTagDelete();
    String contextMenuItemTagInputMethods();
    String contextMenuItemTagUnicode();
    String contextMenuItemTagUnicodeInsertLRMMark();
    String contextMenuItemTagUnicodeInsertRLMMark();
    String contextMenuItemTagUnicodeInsertLREMark();
    String contextMenuItemTagUnicodeInsertRLEMark();
    String contextMenuItemTagUnicodeInsertLROMark();
    String contextMenuItemTagUnicodeInsertRLOMark();
    String contextMenuItemTagUnicodeInsertPDFMark();
    String contextMenuItemTagUnicodeInsertZWSMark();
    String contextMenuItemTagUnicodeInsertZWJMark();
    String contextMenuItemTagUnicodeInsertZWNJMark();
    String contextMenuItemTagSelectAll();
    String contextMenuItemTagInsertEmoji();
#endif
    String contextMenuItemTagNoGuessesFound();
    String contextMenuItemTagIgnoreSpelling();
    String contextMenuItemTagLearnSpelling();
    WEBCORE_EXPORT String contextMenuItemTagSearchWeb();
#if PLATFORM(COCOA)
    WEBCORE_EXPORT String contextMenuItemTagLookUpInDictionary(const String& selectedString);
#endif
    WEBCORE_EXPORT String contextMenuItemTagOpenLink();
    WEBCORE_EXPORT String contextMenuItemTagIgnoreGrammar();
    WEBCORE_EXPORT String contextMenuItemTagSpellingMenu();
    WEBCORE_EXPORT String contextMenuItemTagShowSpellingPanel(bool show);
    WEBCORE_EXPORT String contextMenuItemTagCheckSpelling();
    WEBCORE_EXPORT String contextMenuItemTagCheckSpellingWhileTyping();
    WEBCORE_EXPORT String contextMenuItemTagCheckGrammarWithSpelling();
    WEBCORE_EXPORT String contextMenuItemTagFontMenu();
    WEBCORE_EXPORT String contextMenuItemTagBold();
    WEBCORE_EXPORT String contextMenuItemTagItalic();
    WEBCORE_EXPORT String contextMenuItemTagUnderline();
    WEBCORE_EXPORT String contextMenuItemTagOutline();
    WEBCORE_EXPORT String contextMenuItemTagWritingDirectionMenu();
    String contextMenuItemTagTextDirectionMenu();
    WEBCORE_EXPORT String contextMenuItemTagDefaultDirection();
    WEBCORE_EXPORT String contextMenuItemTagLeftToRight();
    WEBCORE_EXPORT String contextMenuItemTagRightToLeft();
#if PLATFORM(COCOA)
    WEBCORE_EXPORT String contextMenuItemTagShowFonts();
    WEBCORE_EXPORT String contextMenuItemTagStyles();
    WEBCORE_EXPORT String contextMenuItemTagShowColors();
    WEBCORE_EXPORT String contextMenuItemTagSpeechMenu();
    WEBCORE_EXPORT String contextMenuItemTagStartSpeaking();
    WEBCORE_EXPORT String contextMenuItemTagStopSpeaking();
    WEBCORE_EXPORT String contextMenuItemTagCorrectSpellingAutomatically();
    WEBCORE_EXPORT String contextMenuItemTagSubstitutionsMenu();
    WEBCORE_EXPORT String contextMenuItemTagShowSubstitutions(bool show);
    WEBCORE_EXPORT String contextMenuItemTagSmartCopyPaste();
    WEBCORE_EXPORT String contextMenuItemTagSmartQuotes();
    WEBCORE_EXPORT String contextMenuItemTagSmartDashes();
    WEBCORE_EXPORT String contextMenuItemTagSmartLinks();
    WEBCORE_EXPORT String contextMenuItemTagTextReplacement();
    WEBCORE_EXPORT String contextMenuItemTagTransformationsMenu();
    WEBCORE_EXPORT String contextMenuItemTagMakeUpperCase();
    WEBCORE_EXPORT String contextMenuItemTagMakeLowerCase();
    WEBCORE_EXPORT String contextMenuItemTagCapitalize();
    String contextMenuItemTagChangeBack(const String& replacedString);
#endif
    String contextMenuItemTagOpenVideoInNewWindow();
    String contextMenuItemTagOpenAudioInNewWindow();
    String contextMenuItemTagDownloadVideoToDisk();
    String contextMenuItemTagDownloadAudioToDisk();
    String contextMenuItemTagCopyVideoLinkToClipboard();
    String contextMenuItemTagCopyAudioLinkToClipboard();
    String contextMenuItemTagToggleMediaControls();
    String contextMenuItemTagShowMediaControls();
    String contextMenuItemTagHideMediaControls();
    String contextMenuItemTagToggleMediaLoop();
    String contextMenuItemTagEnterVideoFullscreen();
    String contextMenuItemTagExitVideoFullscreen();
#if PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE)
    String contextMenuItemTagEnterVideoEnhancedFullscreen();
    String contextMenuItemTagExitVideoEnhancedFullscreen();
    String contextMenuItemTagEnterVideoViewer();
    String contextMenuItemTagExitVideoViewer();
#endif
    String contextMenuItemTagMediaPlay();
    String contextMenuItemTagMediaPause();
    String contextMenuItemTagMediaMute();
#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    String contextMenuItemTagPlayAllAnimations();
    String contextMenuItemTagPauseAllAnimations();
    String contextMenuItemTagPlayAnimation();
    String contextMenuItemTagPauseAnimation();
#endif
    WEBCORE_EXPORT String contextMenuItemTagInspectElement();
#if HAVE(TRANSLATION_UI_SERVICES)
    String contextMenuItemTagTranslate(const String& selectedString);
#endif
#if ENABLE(WRITING_TOOLS)
    String contextMenuItemTagWritingTools();
#endif
#if ENABLE(UNIFIED_PDF)
    WEBCORE_EXPORT String contextMenuItemPDFOpenWithPreview();
#endif
#if ENABLE(PDFJS) || ENABLE(UNIFIED_PDF)
    WEBCORE_EXPORT String contextMenuItemPDFSinglePage();
    WEBCORE_EXPORT String contextMenuItemPDFSinglePageContinuous();
    WEBCORE_EXPORT String contextMenuItemPDFTwoPages();
    WEBCORE_EXPORT String contextMenuItemPDFTwoPagesContinuous();
    WEBCORE_EXPORT String contextMenuItemPDFZoomIn();
    WEBCORE_EXPORT String contextMenuItemPDFZoomOut();
    WEBCORE_EXPORT String contextMenuItemPDFActualSize();
    WEBCORE_EXPORT String contextMenuItemPDFNextPage();
    WEBCORE_EXPORT String contextMenuItemPDFPreviousPage();
    WEBCORE_EXPORT String contextMenuItemPDFAutoSize();
#endif
#endif // ENABLE(CONTEXT_MENU)

    WEBCORE_EXPORT String pdfDocumentTypeDescription();

#if !PLATFORM(IOS_FAMILY)
    String searchMenuNoRecentSearchesText();
    String searchMenuRecentSearchesText();
    String searchMenuClearRecentSearchesText();
#endif

    String AXWebAreaText();
    String AXLinkText();
    String AXListMarkerText();
    String AXImageMapText();
    String AXHeadingText();
    String AXColorWellText();
    String AXDefinitionText();
    String AXDescriptionListText();
    String AXDescriptionListTermText();
    String AXDescriptionListDetailText();
    String AXFooterRoleDescriptionText();
    String AXSuggestionRoleDescriptionText();
    String AXFileUploadButtonText();
    String AXOutputText();
    String AXSearchFieldCancelButtonText();
    String AXAttachmentRoleText();
    String AXDetailsText();
    String AXSummaryText();
    String AXFeedText();
    String AXFigureText();
    String AXEmailFieldText();
    String AXTelephoneFieldText();
    String AXURLFieldText();
    String AXDateFieldText();
    String AXTimeFieldText();
    String AXDateFieldMonthText();
    String AXDateFieldDayText();
    String AXDateFieldYearText();
    String AXTimeFieldHourText();
    String AXTimeFieldMinuteText();
    String AXTimeFieldSecondText();
    String AXTimeFieldMillisecondText();
    String AXDateTimeFieldText();
    String AXMonthFieldText();
    String AXNumberFieldText();
    String AXWeekFieldText();
    String AXARIAContentGroupText(StringView ariaType);
    String AXHorizontalRuleDescriptionText();
    String AXMarkText();

    String AXButtonActionVerb();
    String AXRadioButtonActionVerb();
    String AXTextFieldActionVerb();
    String AXCheckedCheckboxActionVerb();
    String AXUncheckedCheckboxActionVerb();
    String AXMenuListActionVerb();
    String AXMenuListPopupActionVerb();
    String AXLinkActionVerb();
    String AXListItemActionVerb();

#if PLATFORM(COCOA)
    String AXMeterGaugeRegionOptimumText();
    String AXMeterGaugeRegionSuboptimalText();
    String AXMeterGaugeRegionLessGoodText();
#endif
#if ENABLE(APPLE_PAY)
    String AXApplePayPlainLabel();
    String AXApplePayBuyLabel();
    String AXApplePaySetupLabel();
    String AXApplePayDonateLabel();
    String AXApplePayCheckOutLabel();
    String AXApplePayBookLabel();
    String AXApplePaySubscribeLabel();
#if ENABLE(APPLE_PAY_NEW_BUTTON_TYPES)
    String AXApplePayReloadLabel();
    String AXApplePayAddMoneyLabel();
    String AXApplePayTopUpLabel();
    String AXApplePayOrderLabel();
    String AXApplePayRentLabel();
    String AXApplePaySupportLabel();
    String AXApplePayContributeLabel();
    String AXApplePayTipLabel();
#endif
#endif

    String AXAutoFillCredentialsLabel();
    String AXAutoFillContactsLabel();
    String AXAutoFillStrongPasswordLabel();
    String AXAutoFillCreditCardLabel();
    String AXAutoFillLoadingLabel();
    String autoFillStrongPasswordLabel();

    String AXProcessingPage(double);

    String missingPluginText();
    String crashedPluginText();
    String blockedPluginByContentSecurityPolicyText();
    String insecurePluginVersionText();
    String unsupportedPluginText();
    WEBCORE_EXPORT String pluginTooSmallText();

    WEBCORE_EXPORT String multipleFileUploadText(unsigned numberOfFiles);
    String unknownFileSizeText();

#if PLATFORM(IOS_FAMILY)
    String htmlSelectMultipleItems(size_t num);
    String fileButtonChooseMediaFileLabel();
    String fileButtonChooseMultipleMediaFilesLabel();
    String fileButtonNoMediaFileSelectedLabel();
    String fileButtonNoMediaFilesSelectedLabel();

    WEBCORE_EXPORT String formControlDoneButtonTitle();
#endif

    String imageTitle(const String& filename, const IntSize& size);

    String mediaElementLoadingStateText();
    String mediaElementLiveBroadcastStateText();
    String localizedMediaControlElementString(const String&);
    String localizedMediaControlElementHelpText(const String&);
    String localizedMediaTimeDescription(float);

    String validationMessageValueMissingText();
    String validationMessageValueMissingForCheckboxText();
    String validationMessageValueMissingForFileText();
    String validationMessageValueMissingForMultipleFileText();
    String validationMessageValueMissingForRadioText();
    String validationMessageValueMissingForSelectText();
    String validationMessageValueMissingForSwitchText();
    String validationMessageTypeMismatchText();
    String validationMessageTypeMismatchForEmailText();
    String validationMessageTypeMismatchForMultipleEmailText();
    String validationMessageTypeMismatchForURLText();
    String validationMessagePatternMismatchText();
    String validationMessagePatternMismatchText(const String& title);
    String validationMessageTooShortText(int valueLength, int minLength);
    String validationMessageTooLongText(int valueLength, int maxLength);
    String validationMessageRangeUnderflowText(const String& minimum);
    String validationMessageRangeOverflowText(const String& maximum);
    String validationMessageStepMismatchText(const String& base, const String& step);
    String validationMessageBadInputForNumberText();
#if USE(SOUP)
    String unacceptableTLSCertificate();
#endif

    String clickToExitFullScreenText();

#if ENABLE(VIDEO)
    String trackNoLabelText();
    String textTrackOffMenuItemText();
    String textTrackAutomaticMenuItemText();
#if PLATFORM(COCOA)
    String addTrackLabelAsSuffix(const String&, const String&);
    String textTrackKindClosedCaptionsDisplayName();
    String addTextTrackKindClosedCaptionsSuffix(const String&);
    String textTrackKindCaptionsDisplayName();
    String addTextTrackKindCaptionsSuffix(const String&);
    String textTrackKindDescriptionsDisplayName();
    String addTextTrackKindDescriptionsSuffix(const String&);
    String textTrackKindChaptersDisplayName();
    String addTextTrackKindChaptersSuffix(const String&);
    String textTrackKindMetadataDisplayName();
    String addTextTrackKindMetadataSuffix(const String&);
    String textTrackKindSDHDisplayName();
    String addTextTrackKindSDHSuffix(const String&);
    String textTrackKindEasyReaderDisplayName();
    String addTextTrackKindEasyReaderSuffix(const String&);
    String textTrackKindForcedDisplayName();
    String addTextTrackKindForcedSuffix(const String&);
    String audioTrackKindDescriptionsDisplayName();
    String addAudioTrackKindDescriptionsSuffix(const String&);
    String audioTrackKindCommentaryDisplayName();
    String addAudioTrackKindCommentarySuffix(const String&);
#endif // PLATFORM(COCOA)
    String contextMenuItemTagShowMediaStats();
#endif // ENABLE(VIDEO)

    String snapshottedPlugInLabelTitle();
    String snapshottedPlugInLabelSubtitle();

    WEBCORE_EXPORT String useBlockedPlugInContextMenuTitle();

#if PLATFORM(COCOA)
    String webCryptoMasterKeyKeychainLabel(const String& localizedApplicationName);
    String webCryptoMasterKeyKeychainComment();
#endif

#if PLATFORM(MAC)
    WEBCORE_EXPORT String insertListTypeNone();
    WEBCORE_EXPORT String insertListTypeBulleted();
    WEBCORE_EXPORT String insertListTypeBulletedAccessibilityTitle();
    WEBCORE_EXPORT String insertListTypeNumbered();
    WEBCORE_EXPORT String insertListTypeNumberedAccessibilityTitle();
    WEBCORE_EXPORT String exitFullScreenButtonAccessibilityTitle();
#endif

#if PLATFORM(WATCHOS)
    WEBCORE_EXPORT String numberPadOKButtonTitle();
    WEBCORE_EXPORT String formControlCancelButtonTitle();
    WEBCORE_EXPORT String formControlHideButtonTitle();
    WEBCORE_EXPORT String formControlGoButtonTitle();
    WEBCORE_EXPORT String formControlSearchButtonTitle();
    WEBCORE_EXPORT String datePickerSetButtonTitle();
    WEBCORE_EXPORT String datePickerDayLabelTitle();
    WEBCORE_EXPORT String datePickerMonthLabelTitle();
    WEBCORE_EXPORT String datePickerYearLabelTitle();
#endif

#if ENABLE(INPUT_TYPE_WEEK_PICKER)
    WEBCORE_EXPORT String inputWeekLabel(const DateComponents&);
#endif

#if ENABLE(WEB_AUTHN)
    WEBCORE_EXPORT String makeCredentialTouchIDPromptTitle(const String& bundleName, const String& domain);
    WEBCORE_EXPORT String getAssertionTouchIDPromptTitle(const String& bundleName, const String& domain);
    WEBCORE_EXPORT String genericTouchIDPromptTitle();
#endif

#if ENABLE(IMAGE_ANALYSIS)
    WEBCORE_EXPORT String contextMenuItemTagLookUpImage();
#endif

#if ENABLE(IMAGE_ANALYSIS_ENHANCEMENTS)
    WEBCORE_EXPORT String contextMenuItemTagCopySubject();
    WEBCORE_EXPORT String contextMenuItemTitleRemoveBackground();
#endif

    WEBCORE_EXPORT String pdfPasswordFormTitle();
    WEBCORE_EXPORT String pdfPasswordFormSubtitle();
    WEBCORE_EXPORT String pdfPasswordFormInvalidPasswordSubtitle();

#if ENABLE(LINEAR_MEDIA_PLAYER)
    WEBCORE_EXPORT String fullscreenControllerViewSpatial();
#endif

#if PLATFORM(COCOA)
#define WEB_UI_STRING(string, description) WebCore::localizedString(CFSTR(string))
#define WEB_UI_STRING_KEY(string, key, description) WebCore::localizedString(CFSTR(key))
#define WEB_UI_STRING_WITH_MNEMONIC(string, mnemonic, description) WebCore::localizedString(CFSTR(string))
#elif PLATFORM(WIN)
#define WEB_UI_STRING(string, description) WebCore::localizedString(L##string)
#define WEB_UI_STRING_KEY(string, key, description) WebCore::localizedString(L##string)
#define WEB_UI_STRING_WITH_MNEMONIC(string, mnemonic, description) WebCore::localizedString(L##string)
#elif USE(GLIB) && defined(GETTEXT_PACKAGE)
#define WEB_UI_STRING(string, description) WebCore::localizedString(_(string))
#define WEB_UI_STRING_KEY(string, key, description) WebCore::localizedString(C_(key, string))
#define WEB_UI_STRING_WITH_MNEMONIC(string, mnemonic, description) WebCore::localizedString(_(mnemonic))
#else
#define WEB_UI_STRING(string, description) WebCore::localizedString(string)
#define WEB_UI_STRING_KEY(string, key, description) WebCore::localizedString(key)
#define WEB_UI_STRING_WITH_MNEMONIC(string, mnemonic, description) WebCore::localizedString(string)
#endif

#if PLATFORM(COCOA)
// This is exactly as WEB_UI_STRING, but renamed to ensure the string is not scanned by non-CF ports.
#define WEB_UI_CFSTRING(string, description) WebCore::localizedString(CFSTR(string))
#define WEB_UI_CFSTRING_KEY(string, key, description) WebCore::localizedString(CFSTR(key))

    WEBCORE_EXPORT RetainPtr<CFStringRef> copyLocalizedString(CFStringRef key);
#endif

#if PLATFORM(COCOA)
    WEBCORE_EXPORT String localizedString(CFStringRef key);
#elif PLATFORM(WIN)
    WEBCORE_EXPORT String localizedString(const wchar_t* key);
#else
    WEBCORE_EXPORT String localizedString(const char* key);
#endif

#if PLATFORM(COCOA)
#define WEB_UI_FORMAT_CFSTRING(string, description, ...) WebCore::formatLocalizedString(CFSTR(string), __VA_ARGS__)
#define WEB_UI_FORMAT_CFSTRING_KEY(string, key, description, ...) WebCore::formatLocalizedString(CFSTR(key), __VA_ARGS__)
#define WEB_UI_FORMAT_STRING(string, description, ...) WebCore::formatLocalizedString(CFSTR(string), __VA_ARGS__)
#elif PLATFORM(WIN)
#define WEB_UI_FORMAT_STRING(string, description, ...) WebCore::formatLocalizedString(L##string, __VA_ARGS__)
#elif USE(GLIB) && defined(GETTEXT_PACKAGE)
#define WEB_UI_FORMAT_STRING(string, description, ...) WebCore::formatLocalizedString(_(string), __VA_ARGS__)
#else
#define WEB_UI_FORMAT_STRING(string, description, ...) WebCore::formatLocalizedString(string, __VA_ARGS__)
#endif

#if PLATFORM(COCOA)
    WEBCORE_EXPORT String formatLocalizedString(CFStringRef format, ...) CF_FORMAT_FUNCTION(1, 2);
#elif PLATFORM(WIN)
    WEBCORE_EXPORT String formatLocalizedString(const wchar_t* format, ...) WTF_ATTRIBUTE_PRINTF(1, 2);
#else
    WEBCORE_EXPORT String formatLocalizedString(const char* format, ...) WTF_ATTRIBUTE_PRINTF(1, 2);
#endif

#ifdef __OBJC__
#define WEB_UI_NSSTRING(string, description) WebCore::localizedNSString(string)
#define WEB_UI_NSSTRING_KEY(string, key, description) WebCore::localizedNSString(key)

    inline NS_FORMAT_ARGUMENT(1) NSString *localizedNSString(NSString *key)
    {
        return bridge_cast(copyLocalizedString(bridge_cast(key)).autorelease());
    }
#endif

} // namespace WebCore

#endif // LocalizedStrings_h
