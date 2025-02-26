/*
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies).
 * Copyright (C) 2012, Samsung Electronics. All rights reserved.
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
 */

#pragma once

#include "AXObjectCache.h"
#include "Cursor.h"
#include "DisabledAdaptations.h"
#include "FocusDirection.h"
#include "HostWindow.h"
#include "ImageBufferPixelFormat.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/FunctionDispatcher.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>

#if PLATFORM(COCOA)
OBJC_CLASS NSView;
#endif

namespace WebCore {

namespace ShapeDetection {
class BarcodeDetector;
struct BarcodeDetectorOptions;
enum class BarcodeFormat : uint8_t;
class FaceDetector;
struct FaceDetectorOptions;
class TextDetector;
}

namespace WebGPU {
class GPU;
}

enum class PlatformEventModifier : uint8_t;
enum class TextDirection : bool;

class ChromeClient;
class ColorChooser;
class ColorChooserClient;
class DataListSuggestionPicker;
class DataListSuggestionsClient;
class DateTimeChooser;
class DateTimeChooserClient;
class FileChooser;
class FileIconLoader;
class FloatRect;
class Frame;
class Element;
class Geolocation;
class HitTestResult;
class IntPoint;
class IntRect;
class LocalFrame;
class NavigationAction;
class Page;
class PopupMenu;
class PopupMenuClient;
class PopupOpeningObserver;
class SearchPopupMenu;
class WorkerClient;

struct AppHighlight;
struct ContactInfo;
struct ContactsRequestData;
struct DateTimeChooserParameters;
struct ShareDataWithParsedURL;
struct ViewportArguments;
struct WindowFeatures;

class Chrome : public HostWindow {
    WTF_MAKE_TZONE_ALLOCATED(Chrome);
public:
    Chrome(Page&, UniqueRef<ChromeClient>&&);
    virtual ~Chrome();

    ChromeClient& client() { return m_client; }
    const ChromeClient& client() const { return m_client; }

    // HostWindow methods.
    void invalidateRootView(const IntRect&) override;
    void invalidateContentsAndRootView(const IntRect&) override;
    void invalidateContentsForSlowScroll(const IntRect&) override;
    void scroll(const IntSize&, const IntRect&, const IntRect&) override;
    IntPoint screenToRootView(const IntPoint&) const override;
    IntRect rootViewToScreen(const IntRect&) const override;
    IntPoint accessibilityScreenToRootView(const IntPoint&) const override;
    IntRect rootViewToAccessibilityScreen(const IntRect&) const override;
    PlatformPageClient platformPageClient() const override;
#if PLATFORM(IOS_FAMILY)
    void relayAccessibilityNotification(const String&, const RetainPtr<NSData>&) const override;
#endif
    void setCursor(const Cursor&) override;
    void setCursorHiddenUntilMouseMoves(bool) override;

    RefPtr<ImageBuffer> createImageBuffer(const FloatSize&, RenderingMode, RenderingPurpose, float resolutionScale, const DestinationColorSpace&, ImageBufferPixelFormat) const override;
    RefPtr<WebCore::ImageBuffer> sinkIntoImageBuffer(std::unique_ptr<WebCore::SerializedImageBuffer>) override;

#if ENABLE(WEBGL)
    RefPtr<GraphicsContextGL> createGraphicsContextGL(const GraphicsContextGLAttributes&) const override;
#endif
#if HAVE(WEBGPU_IMPLEMENTATION)
    RefPtr<WebGPU::GPU> createGPUForWebGPU() const override;
#endif
    RefPtr<ShapeDetection::BarcodeDetector> createBarcodeDetector(const ShapeDetection::BarcodeDetectorOptions&) const;
    void getBarcodeDetectorSupportedFormats(CompletionHandler<void(Vector<ShapeDetection::BarcodeFormat>&&)>&&) const;
    RefPtr<ShapeDetection::FaceDetector> createFaceDetector(const ShapeDetection::FaceDetectorOptions&) const;
    RefPtr<ShapeDetection::TextDetector> createTextDetector() const;

    PlatformDisplayID displayID() const override;
    void windowScreenDidChange(PlatformDisplayID, std::optional<FramesPerSecond>) override;

    FloatSize screenSize() const override;
    FloatSize availableScreenSize() const override;
    FloatSize overrideScreenSize() const override;
    FloatSize overrideAvailableScreenSize() const override;

    void scrollContainingScrollViewsToRevealRect(const IntRect&) const;
    WEBCORE_EXPORT void scrollMainFrameToRevealRect(const IntRect&) const;

    void contentsSizeChanged(LocalFrame&, const IntSize&) const;

    WEBCORE_EXPORT void setWindowRect(const FloatRect&);
    WEBCORE_EXPORT FloatRect windowRect() const;

    FloatRect pageRect() const;

    void focus();
    void unfocus();

    bool canTakeFocus(FocusDirection) const;
    void takeFocus(FocusDirection);

    void focusedElementChanged(Element*);
    void focusedFrameChanged(Frame*);

    WEBCORE_EXPORT RefPtr<Page> createWindow(LocalFrame&, const String& openedMainFrameName, const WindowFeatures&, const NavigationAction&);
    WEBCORE_EXPORT void show();

    bool canRunModal() const;
    void runModal();

    void setToolbarsVisible(bool);
    bool toolbarsVisible() const;

    void setStatusbarVisible(bool);
    bool statusbarVisible() const;

    void setScrollbarsVisible(bool);
    bool scrollbarsVisible() const;

    void setMenubarVisible(bool);
    bool menubarVisible() const;

    void setResizable(bool);

    bool canRunBeforeUnloadConfirmPanel();
    bool runBeforeUnloadConfirmPanel(const String& message, LocalFrame&);

    void closeWindow();

    void runJavaScriptAlert(LocalFrame&, const String&);
    bool runJavaScriptConfirm(LocalFrame&, const String&);
    bool runJavaScriptPrompt(LocalFrame&, const String& message, const String& defaultValue, String& result);

    void mouseDidMoveOverElement(const HitTestResult&, OptionSet<PlatformEventModifier>);

    WEBCORE_EXPORT bool print(LocalFrame&);

    WEBCORE_EXPORT void enableSuddenTermination();
    WEBCORE_EXPORT void disableSuddenTermination();

#if ENABLE(INPUT_TYPE_COLOR)
    RefPtr<ColorChooser> createColorChooser(ColorChooserClient&, const Color& initialColor);
#endif

#if ENABLE(DATALIST_ELEMENT)
    RefPtr<DataListSuggestionPicker> createDataListSuggestionPicker(DataListSuggestionsClient&);
#endif

#if ENABLE(DATE_AND_TIME_INPUT_TYPES)
    RefPtr<DateTimeChooser> createDateTimeChooser(DateTimeChooserClient&);
#endif

    std::unique_ptr<WorkerClient> createWorkerClient(SerialFunctionDispatcher&);

    void runOpenPanel(LocalFrame&, FileChooser&);
    void showShareSheet(ShareDataWithParsedURL&, CompletionHandler<void(bool)>&&);
    void showContactPicker(const ContactsRequestData&, CompletionHandler<void(std::optional<Vector<ContactInfo>>&&)>&&);
    void loadIconForFiles(const Vector<String>&, FileIconLoader&);

    void dispatchDisabledAdaptationsDidChange(const OptionSet<DisabledAdaptations>&) const;
    void dispatchViewportPropertiesDidChange(const ViewportArguments&) const;

    bool requiresFullscreenForVideoPlayback();

#if PLATFORM(COCOA)
    WEBCORE_EXPORT void focusNSView(NSView*);
#endif

    bool selectItemWritingDirectionIsNatural();
    bool selectItemAlignmentFollowsMenuWritingDirection();
    RefPtr<PopupMenu> createPopupMenu(PopupMenuClient&) const;
    RefPtr<SearchPopupMenu> createSearchPopupMenu(PopupMenuClient&) const;

#if PLATFORM(IOS_FAMILY)
    // FIXME: Can we come up with a better name for this setter?
    void setDispatchViewportDataDidChangeSuppressed(bool dispatchViewportDataDidChangeSuppressed) { m_isDispatchViewportDataDidChangeSuppressed = dispatchViewportDataDidChangeSuppressed; }
#endif

    void didReceiveDocType(LocalFrame&);

    void registerPopupOpeningObserver(PopupOpeningObserver&);
    void unregisterPopupOpeningObserver(PopupOpeningObserver&);

    WEBCORE_EXPORT void getToolTip(const HitTestResult&, String&, TextDirection&);

private:
    void notifyPopupOpeningObservers() const;
    Ref<Page> protectedPage() const;

    WeakRef<Page> m_page;
    UniqueRef<ChromeClient> m_client;
    Vector<WeakPtr<PopupOpeningObserver>> m_popupOpeningObservers;
#if PLATFORM(IOS_FAMILY)
    bool m_isDispatchViewportDataDidChangeSuppressed { false };
#endif
};

} // namespace WebCore
