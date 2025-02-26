/*
 * Copyright (C) 2006-2018 Apple Inc. All rights reserved.
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

#pragma once

#include "DragImage.h"
#include "PasteboardContext.h"
#include "PasteboardCustomData.h"
#include "PasteboardItemInfo.h"
#include "SharedBuffer.h"
#include <wtf/HashMap.h>
#include <wtf/ListHashSet.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/URL.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(IOS_FAMILY)
OBJC_CLASS NSString;
#endif

#if PLATFORM(COCOA)
OBJC_CLASS NSArray;
#endif

#if PLATFORM(GTK) || PLATFORM(WPE)
#include "SelectionData.h"
#endif

#if PLATFORM(WIN)
#include "COMPtr.h"
#include "WCDataObject.h"
#include <objidl.h>
#include <windows.h>
typedef struct HWND__* HWND;
#endif

// FIXME: This class uses the DOM and makes calls to Editor.
// It should be divested of its knowledge of the frame and editor.

namespace WebCore {

class DocumentFragment;
class DragData;
class Element;
class LocalFrame;
class PasteboardStrategy;
class FragmentedSharedBuffer;

struct SimpleRange;

enum class PlainTextURLReadingPolicy : bool { IgnoreURL, AllowURL };
enum class WebContentReadingPolicy : bool { AnyType, OnlyRichTextTypes };
enum ShouldSerializeSelectedTextForDataTransfer { DefaultSelectedTextType, IncludeImageAltTextForDataTransfer };

// For writing to the pasteboard. Generally sorted with the richest formats on top.

struct PasteboardWebContent {
#if PLATFORM(COCOA)
    String contentOrigin;
    bool canSmartCopyOrDelete;
    RefPtr<SharedBuffer> dataInWebArchiveFormat;
    RefPtr<SharedBuffer> dataInRTFDFormat;
    RefPtr<SharedBuffer> dataInRTFFormat;
    RefPtr<SharedBuffer> dataInAttributedStringFormat;
    String dataInHTMLFormat;
    String dataInStringFormat;
    Vector<std::pair<String, RefPtr<WebCore::SharedBuffer>>> clientTypesAndData;
#endif
#if PLATFORM(GTK)
    String contentOrigin;
    bool canSmartCopyOrDelete;
    String text;
    String markup;
#endif
#if USE(LIBWPE)
    String text;
    String markup;
#endif
};

struct PasteboardURL {
    URL url;
    String title;
#if PLATFORM(MAC)
    String userVisibleForm;
#endif
#if PLATFORM(GTK) || PLATFORM(WPE)
    String markup;
#endif
};

struct PasteboardImage {
    RefPtr<Image> image;
#if PLATFORM(MAC)
    RefPtr<SharedBuffer> dataInWebArchiveFormat;
    String dataInHTMLFormat;
#endif
#if !PLATFORM(WIN)
    PasteboardURL url;
#endif
#if !(PLATFORM(GTK) || PLATFORM(WIN))
    RefPtr<SharedBuffer> resourceData;
    String resourceMIMEType;
    Vector<std::pair<String, RefPtr<WebCore::SharedBuffer>>> clientTypesAndData;
#endif
    String suggestedName;
    FloatSize imageSize;
};

struct PasteboardBuffer {
#if PLATFORM(COCOA)
    String contentOrigin;
#endif
    String type;
    RefPtr<SharedBuffer> data;
};

// For reading from the pasteboard.

class PasteboardWebContentReader {
public:
    virtual ~PasteboardWebContentReader() = default;

#if PLATFORM(COCOA) || PLATFORM(GTK)
    virtual bool readFilePath(const String&, PresentationSize preferredPresentationSize = { }, const String& contentType = { }) = 0;
    virtual bool readFilePaths(const Vector<String>&) = 0;
    virtual bool readHTML(const String&) = 0;
    virtual bool readImage(Ref<FragmentedSharedBuffer>&&, const String& type, PresentationSize preferredPresentationSize = { }) = 0;
    virtual bool readURL(const URL&, const String& title) = 0;
    virtual bool readPlainText(const String&) = 0;
#endif

#if PLATFORM(COCOA)
    virtual bool readWebArchive(SharedBuffer&) = 0;
    virtual bool readRTFD(SharedBuffer&) = 0;
    virtual bool readRTF(SharedBuffer&) = 0;
    virtual bool readDataBuffer(SharedBuffer&, const String& type, const AtomString& name, PresentationSize preferredPresentationSize = { }) = 0;
#endif

    const String& contentOrigin() const { return m_contentOrigin; }
    void setContentOrigin(const String& contentOrigin) { m_contentOrigin = contentOrigin; }

private:
    String m_contentOrigin;
};

struct PasteboardPlainText {
    String text;
#if PLATFORM(COCOA)
    bool isURL;
#endif
};

struct PasteboardFileReader {
    virtual ~PasteboardFileReader() = default;
    virtual void readFilename(const String&) = 0;
    virtual bool shouldReadBuffer(const String& /* type */) const { return true; }
    virtual void readBuffer(const String& filename, const String& type, Ref<SharedBuffer>&&) = 0;
};

class Pasteboard {
    WTF_MAKE_TZONE_ALLOCATED(Pasteboard);
    WTF_MAKE_NONCOPYABLE(Pasteboard);
public:
    Pasteboard(std::unique_ptr<PasteboardContext>&&);
    virtual ~Pasteboard();

#if PLATFORM(GTK)
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, const String& name);
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, SelectionData&);
#if ENABLE(DRAG_SUPPORT)
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, SelectionData&&);
#endif
#endif

#if PLATFORM(WPE) && ENABLE(DRAG_SUPPORT)
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, SelectionData&);
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, SelectionData&&);
#endif

#if PLATFORM(WIN)
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, IDataObject*);
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, WCDataObject*);
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, const DragDataMap&);
#endif

    WEBCORE_EXPORT static std::unique_ptr<Pasteboard> createForCopyAndPaste(std::unique_ptr<PasteboardContext>&&);

    static bool isSafeTypeForDOMToReadAndWrite(const String&);
    static bool canExposeURLToDOMWhenPasteboardContainsFiles(const String&);

    virtual bool isStatic() const { return false; }

    virtual WEBCORE_EXPORT bool hasData();
    virtual WEBCORE_EXPORT Vector<String> typesSafeForBindings(const String& origin);
    virtual WEBCORE_EXPORT Vector<String> typesForLegacyUnsafeBindings();
    virtual WEBCORE_EXPORT String readOrigin();
    virtual WEBCORE_EXPORT String readString(const String& type);
    virtual WEBCORE_EXPORT String readStringInCustomData(const String& type);
    virtual WEBCORE_EXPORT Vector<String> readAllStrings(const String& type);

    virtual WEBCORE_EXPORT void writeString(const String& type, const String& data);
    virtual WEBCORE_EXPORT void clear();
    virtual WEBCORE_EXPORT void clear(const String& type);

    virtual WEBCORE_EXPORT void read(PasteboardPlainText&, PlainTextURLReadingPolicy = PlainTextURLReadingPolicy::AllowURL, std::optional<size_t> itemIndex = std::nullopt);
    virtual WEBCORE_EXPORT void read(PasteboardWebContentReader&, WebContentReadingPolicy = WebContentReadingPolicy::AnyType, std::optional<size_t> itemIndex = std::nullopt);
    virtual WEBCORE_EXPORT void read(PasteboardFileReader&, std::optional<size_t> itemIndex = std::nullopt);

    static bool canWriteTrustworthyWebURLsPboardType();

    virtual WEBCORE_EXPORT void write(const Color&);
    virtual WEBCORE_EXPORT void write(const PasteboardURL&);
    virtual WEBCORE_EXPORT void writeTrustworthyWebURLsPboardType(const PasteboardURL&);
    virtual WEBCORE_EXPORT void write(const PasteboardImage&);
    virtual WEBCORE_EXPORT void write(const PasteboardBuffer&);
    virtual WEBCORE_EXPORT void write(const PasteboardWebContent&);

    virtual WEBCORE_EXPORT void writeCustomData(const Vector<PasteboardCustomData>&);

    enum class FileContentState : uint8_t { NoFileOrImageData, InMemoryImage, MayContainFilePaths };
    virtual WEBCORE_EXPORT FileContentState fileContentState();
    virtual WEBCORE_EXPORT bool canSmartReplace();

    virtual WEBCORE_EXPORT void writeMarkup(const String& markup);
    enum SmartReplaceOption { CanSmartReplace, CannotSmartReplace };
    virtual WEBCORE_EXPORT void writePlainText(const String&, SmartReplaceOption); // FIXME: Two separate functions would be clearer than one function with an argument.

#if ENABLE(DRAG_SUPPORT)
    WEBCORE_EXPORT static std::unique_ptr<Pasteboard> createForDragAndDrop(std::unique_ptr<PasteboardContext>&&);
    WEBCORE_EXPORT static std::unique_ptr<Pasteboard> create(const DragData&);

    WEBCORE_EXPORT virtual void setDragImage(DragImage, const IntPoint& hotSpot);
#endif

#if PLATFORM(WIN)
    RefPtr<DocumentFragment> documentFragment(LocalFrame&, const SimpleRange&, bool allowPlainText, bool& chosePlainText); // FIXME: Layering violation.
    void writeImage(Element&, const URL&, const String& title); // FIXME: Layering violation.
    void writeSelection(const SimpleRange&, bool canSmartCopyOrDelete, LocalFrame&, ShouldSerializeSelectedTextForDataTransfer = DefaultSelectedTextType); // FIXME: Layering violation.
#endif

#if PLATFORM(GTK)
    const SelectionData& selectionData() const;
    static std::unique_ptr<Pasteboard> createForGlobalSelection(std::unique_ptr<PasteboardContext>&&);
    int64_t changeCount() const;
#endif

#if PLATFORM(WPE)
    const SelectionData& selectionData() const {
        return *m_selectionData;
    }
#endif

#if PLATFORM(IOS_FAMILY)
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, int64_t changeCount);
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, const String& pasteboardName);

    static NSArray *supportedWebContentPasteboardTypes();
    static String resourceMIMEType(NSString *mimeType);
#endif

#if PLATFORM(MAC)
    explicit Pasteboard(std::unique_ptr<PasteboardContext>&&, const String& pasteboardName, const Vector<String>& promisedFilePaths = { });
#endif

#if PLATFORM(COCOA)
#if ENABLE(DRAG_SUPPORT)
    WEBCORE_EXPORT static String nameOfDragPasteboard();
#endif
    static bool shouldTreatCocoaTypeAsFile(const String&);
    WEBCORE_EXPORT static NSArray *supportedFileUploadPasteboardTypes();
    int64_t changeCount() const;
    const PasteboardCustomData& readCustomData();
#elif !PLATFORM(GTK)
    int64_t changeCount() const { return 0; }
#endif

#if PLATFORM(COCOA)
    const String& name() const { return m_pasteboardName; }
#elif PLATFORM(GTK)
    const String& name() const { return m_name; }
#else
    const String& name() const { return emptyString(); }
#endif

#if PLATFORM(MAC)
    WEBCORE_EXPORT static RefPtr<SharedBuffer> bufferConvertedToPasteboardType(const PasteboardBuffer&, const String& pasteboardType);
#else
    static RefPtr<SharedBuffer> bufferConvertedToPasteboardType(const PasteboardBuffer& pasteboardBuffer, const String&) { return pasteboardBuffer.data; };
#endif

#if PLATFORM(WIN)
    COMPtr<IDataObject> dataObject() const { return m_dataObject; }
    WEBCORE_EXPORT void setExternalDataObject(IDataObject*);
    const DragDataMap& dragDataMap() const { return m_dragDataMap; }
    WEBCORE_EXPORT DragDataMap createDragDataMap();
    void writeURLToWritableDataObject(const URL&, const String&);
    COMPtr<WCDataObject> writableDataObject() const { return m_writableDataObject; }
    void writeImageToDataObject(Element&, const URL&); // FIXME: Layering violation.
#endif

    std::optional<Vector<PasteboardItemInfo>> allPasteboardItemInfo() const;
    std::optional<PasteboardItemInfo> pasteboardItemInfo(size_t index) const;

    String readString(size_t index, const String& type);
    RefPtr<WebCore::SharedBuffer> readBuffer(std::optional<size_t> index, const String& type);
    URL readURL(size_t index, String& title);

    const PasteboardContext* context() const { return m_context.get(); }

private:
#if PLATFORM(IOS_FAMILY)
    bool respectsUTIFidelities() const;
    void readRespectingUTIFidelities(PasteboardWebContentReader&, WebContentReadingPolicy, std::optional<size_t>);

    enum class ReaderResult {
        ReadType,
        DidNotReadType,
        PasteboardWasChangedExternally
    };
    ReaderResult readPasteboardWebContentDataForType(PasteboardWebContentReader&, PasteboardStrategy&, NSString *type, const PasteboardItemInfo&, int itemIndex);
#endif

#if PLATFORM(WIN)
    void finishCreatingPasteboard();
    void writeRangeToDataObject(const SimpleRange&, LocalFrame&); // FIXME: Layering violation.
    void writeURLToDataObject(const URL&, const String&);
    void writePlainTextToDataObject(const String&, SmartReplaceOption);
    std::optional<PasteboardCustomData> readPasteboardCustomData();
#endif

#if PLATFORM(COCOA)
    Vector<String> readFilePaths();
    Vector<String> readPlatformValuesAsStrings(const String& domType, int64_t changeCount, const String& pasteboardName);
    static void addHTMLClipboardTypesForCocoaType(ListHashSet<String>& resultTypes, const String& cocoaType);
    String readStringForPlatformType(const String&);
    Vector<String> readTypesWithSecurityCheck();
    RefPtr<SharedBuffer> readBufferForTypeWithSecurityCheck(const String&);
#endif

    std::unique_ptr<PasteboardContext> m_context;

#if PLATFORM(GTK)
    std::optional<SelectionData> m_selectionData;
    String m_name;
    int64_t m_changeCount { 0 };
#endif

#if PLATFORM(WPE)
    std::optional<SelectionData> m_selectionData;
#endif

#if PLATFORM(COCOA)
    String m_pasteboardName;
    int64_t m_changeCount;
    std::optional<PasteboardCustomData> m_customDataCache;
#endif

#if PLATFORM(MAC)
    Vector<String> m_promisedFilePaths;
#endif

#if PLATFORM(WIN)
    HWND m_owner;
    COMPtr<IDataObject> m_dataObject;
    COMPtr<WCDataObject> m_writableDataObject;
    DragDataMap m_dragDataMap;
    bool m_forDrag = false;
#endif
};

#if PLATFORM(IOS_FAMILY)
extern NSString *WebArchivePboardType;
extern NSString *UIColorPboardType;
extern NSString *UIImagePboardType;
#endif

#if PLATFORM(MAC)
extern const ASCIILiteral WebArchivePboardType;
extern const ASCIILiteral WebURLNamePboardType;
extern const ASCIILiteral WebURLsWithTitlesPboardType;
#endif

#if !PLATFORM(GTK)

inline Pasteboard::~Pasteboard()
{
}

#endif

} // namespace WebCore
