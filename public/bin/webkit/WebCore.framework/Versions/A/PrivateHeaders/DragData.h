/*
 * Copyright (C) 2007-2020 Apple Inc. All rights reserved.
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

#include "Color.h"
#include "DragActions.h"
#include "IntPoint.h"
#include "PageIdentifier.h"
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/OptionSet.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(MAC)

#ifdef __OBJC__ 
#import <Foundation/Foundation.h>
#import <AppKit/NSDragging.h>
typedef id <NSDraggingInfo> DragDataRef;
#else
typedef void* DragDataRef;
#endif

#elif PLATFORM(WIN)
typedef struct IDataObject* DragDataRef;
#elif PLATFORM(GTK) || PLATFORM(WPE)
namespace WebCore {
class SelectionData;
}
typedef WebCore::SelectionData* DragDataRef;
#else
typedef void* DragDataRef;
#endif

namespace WebCore {

enum class DragApplicationFlags : uint8_t {
    IsModal = 1,
    IsSource = 2,
    HasAttachedSheet = 4,
    IsCopyKeyDown = 8
};

class PasteboardContext;

#if PLATFORM(WIN)
typedef UncheckedKeyHashMap<unsigned, Vector<String>> DragDataMap;
#endif

class DragData {
public:
    enum FilenameConversionPolicy { DoNotConvertFilenames, ConvertFilenames };
    enum class DraggingPurpose { ForEditing, ForFileUpload, ForColorControl };

    // clientPosition is taken to be the position of the drag event within the target window, with (0,0) at the top left
    WEBCORE_EXPORT DragData(DragDataRef, const IntPoint& clientPosition, const IntPoint& globalPosition, OptionSet<DragOperation>, OptionSet<DragApplicationFlags> = { }, OptionSet<DragDestinationAction> = anyDragDestinationAction(), std::optional<PageIdentifier> pageID = std::nullopt);

    WEBCORE_EXPORT DragData(
#if PLATFORM(COCOA)
        const String& dragStorageName,
#endif
        const IntPoint& clientPosition, const IntPoint& globalPosition, OptionSet<DragOperation>, OptionSet<DragApplicationFlags> = { }, OptionSet<DragDestinationAction> = anyDragDestinationAction(), std::optional<PageIdentifier> pageID = std::nullopt);

#if PLATFORM(COCOA)
    WEBCORE_EXPORT DragData(const String& dragStorageName, const IntPoint& clientPosition, const IntPoint& globalPosition, const Vector<String>&, OptionSet<DragOperation>, OptionSet<DragApplicationFlags> = { }, OptionSet<DragDestinationAction> = anyDragDestinationAction(), std::optional<PageIdentifier> pageID = std::nullopt);
#endif
    // This constructor should used only by WebKit2 IPC because DragData
    // is initialized by the decoder and not in the constructor.
    DragData() = default;
#if PLATFORM(WIN)
    WEBCORE_EXPORT DragData(const DragDataMap&, const IntPoint& clientPosition, const IntPoint& globalPosition, OptionSet<DragOperation> sourceOperationMask, OptionSet<DragApplicationFlags> = { }, OptionSet<DragDestinationAction> = anyDragDestinationAction(), std::optional<PageIdentifier> pageID = std::nullopt);
    WEBCORE_EXPORT const DragDataMap& dragDataMap() const;
    void getDragFileDescriptorData(int& size, String& pathname);
    void getDragFileContentData(int size, void* dataBlob);
#endif
    const IntPoint& clientPosition() const { return m_clientPosition; }
    const IntPoint& globalPosition() const { return m_globalPosition; }
    void setClientPosition(const IntPoint& clientPosition) { m_clientPosition = clientPosition; }
    OptionSet<DragApplicationFlags> flags() const { return m_applicationFlags; }
    DragDataRef platformData() const { return m_platformDragData; }
    OptionSet<DragOperation> draggingSourceOperationMask() const { return m_draggingSourceOperationMask; }
    bool containsURL(FilenameConversionPolicy = ConvertFilenames) const;
    bool containsPlainText() const;
    bool containsCompatibleContent(DraggingPurpose = DraggingPurpose::ForEditing) const;
    String asURL(FilenameConversionPolicy = ConvertFilenames, String* title = nullptr) const;
    String asPlainText() const;
    Vector<String> asFilenames() const;
    Color asColor() const;
    bool canSmartReplace() const;
    bool containsColor() const;
    bool containsFiles() const;
    unsigned numberOfFiles() const;
    OptionSet<DragDestinationAction> dragDestinationActionMask() const { return m_dragDestinationActionMask; }
    void setFileNames(Vector<String>& fileNames) { m_fileNames = WTFMove(fileNames); }
    const Vector<String>& fileNames() const { return m_fileNames; }
    void disallowFileAccess();
#if PLATFORM(COCOA)
    const String& pasteboardName() const { return m_pasteboardName; }
    bool containsURLTypeIdentifier() const;
    bool containsPromise() const;
#endif

    bool shouldMatchStyleOnDrop() const;

    std::optional<PageIdentifier> pageID() const { return m_pageID; }

    std::unique_ptr<PasteboardContext> createPasteboardContext() const;

private:
    IntPoint m_clientPosition;
    IntPoint m_globalPosition;
    DragDataRef m_platformDragData { NULL };
    OptionSet<DragOperation> m_draggingSourceOperationMask;
    OptionSet<DragApplicationFlags> m_applicationFlags;
    Vector<String> m_fileNames;
    OptionSet<DragDestinationAction> m_dragDestinationActionMask;
    std::optional<PageIdentifier> m_pageID;
#if PLATFORM(COCOA)
    String m_pasteboardName;
#endif
#if PLATFORM(WIN)
    mutable DragDataMap m_dragDataMap;
#endif
    bool m_disallowFileAccess { false };
};
    
} // namespace WebCore
