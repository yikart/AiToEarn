/*
 * Copyright (C) 2001 Peter Kelly (pmk@post.com)
 * Copyright (C) 2001 Tobias Anton (anton@stud.fbi.fh-darmstadt.de)
 * Copyright (C) 2006 Samuel Weinig (sam.weinig@gmail.com)
 * Copyright (C) 2003-2020 Apple Inc. All rights reserved.
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

#include "CachedResourceHandle.h"
#include "DragActions.h"
#include "DragImage.h"
#include <wtf/CheckedRef.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CachedImage;
class DataTransferItemList;
class Document;
class DragData;
class DragImageLoader;
class Element;
class FileList;
class File;
class Pasteboard;
class ScriptExecutionContext;
enum class WebContentReadingPolicy : bool;

class DataTransfer : public RefCountedAndCanMakeWeakPtr<DataTransfer> {
public:
    // https://html.spec.whatwg.org/multipage/dnd.html#drag-data-store-mode
    enum class StoreMode { Invalid, ReadWrite, Readonly, Protected };

    static Ref<DataTransfer> create();
    static Ref<DataTransfer> createForCopyAndPaste(const Document&, StoreMode, std::unique_ptr<Pasteboard>&&);
    static Ref<DataTransfer> createForInputEvent(const String& plainText, const String& htmlText);

    WEBCORE_EXPORT ~DataTransfer();

    String dropEffect() const;
    void setDropEffect(const String&);

    String effectAllowed() const;
    void setEffectAllowed(const String&);

    DataTransferItemList& items(Document&);
    Vector<String> types(Document&) const;
    Vector<String> typesForItemList(Document&) const;

    FileList& files(Document*) const;
    FileList& files(Document&) const;

    void clearData(const String& type = String());

    String getData(Document&, const String& type) const;
    String getDataForItem(Document&, const String& type) const;

    void setData(Document&, const String& type, const String& data);
    void setDataFromItemList(Document&, const String& type, const String& data);

    void setDragImage(Ref<Element>&&, int x, int y);

    void makeInvalidForSecurity() { m_storeMode = StoreMode::Invalid; }

    bool canReadTypes() const;
    bool canReadData() const;
    bool canWriteData() const;

    bool hasFileOfType(const String&);
    bool hasStringOfType(Document&, const String&);

    Pasteboard& pasteboard() { return *m_pasteboard; }
    void commitToPasteboard(Pasteboard&);

#if ENABLE(DRAG_SUPPORT)
    static Ref<DataTransfer> createForDrag(const Document&);
#if PLATFORM(MAC)
    static Ref<DataTransfer> createForDrag(const Document&, const String& pasteboardName);
#endif
    static Ref<DataTransfer> createForDragStartEvent(const Document&);
    static Ref<DataTransfer> createForDrop(const Document&, std::unique_ptr<Pasteboard>&&, OptionSet<DragOperation>, bool draggingFiles);
    static Ref<DataTransfer> createForUpdatingDropTarget(const Document&, std::unique_ptr<Pasteboard>&&, OptionSet<DragOperation>, bool draggingFiles);

    bool dropEffectIsUninitialized() const { return m_dropEffect == "uninitialized"_s; }

    OptionSet<DragOperation> sourceOperationMask() const;
    OptionSet<DragOperation> destinationOperationMask() const;
    void setSourceOperationMask(OptionSet<DragOperation>);
    void setDestinationOperationMask(OptionSet<DragOperation>);

    void setDragHasStarted() { m_shouldUpdateDragImage = true; }
    DragImageRef createDragImage(IntPoint& dragLocation) const;
    void updateDragImage();
    RefPtr<Element> dragImageElement() const;

    void moveDragState(Ref<DataTransfer>&&);
    bool hasDragImage() const;

    IntPoint dragLocation() const { return m_dragLocation; }
#endif

    void didAddFileToItemList();
    void updateFileList(ScriptExecutionContext*);

private:
    enum class Type { CopyAndPaste, DragAndDropData, DragAndDropFiles, InputEvent };
    DataTransfer(StoreMode, std::unique_ptr<Pasteboard>, Type = Type::CopyAndPaste, String&& effectAllowed = "uninitialized"_s);

    bool allowsFileAccess() const
    {
        return !forDrag() || forFileDrag();
    }

#if ENABLE(DRAG_SUPPORT)
    bool forDrag() const { return m_type == Type::DragAndDropData || m_type == Type::DragAndDropFiles; }
    bool forFileDrag() const { return m_type == Type::DragAndDropFiles; }
#else
    bool forDrag() const { return false; }
    bool forFileDrag() const { return false; }
#endif

    String readStringFromPasteboard(Document&, const String& lowercaseType, WebContentReadingPolicy) const;
    bool shouldSuppressGetAndSetDataToAvoidExposingFilePaths() const;

    enum class AddFilesType : bool { No, Yes };
    Vector<String> types(Document&, AddFilesType) const;
    Vector<Ref<File>> filesFromPasteboardAndItemList(ScriptExecutionContext*) const;

    String m_originIdentifier;
    StoreMode m_storeMode;
    std::unique_ptr<Pasteboard> m_pasteboard;
    std::unique_ptr<DataTransferItemList> m_itemList;

    mutable RefPtr<FileList> m_fileList;

#if ENABLE(DRAG_SUPPORT)
    Type m_type;
    String m_dropEffect;
    String m_effectAllowed;
    bool m_shouldUpdateDragImage;
    IntPoint m_dragLocation;
    CachedResourceHandle<CachedImage> m_dragImage;
    RefPtr<Element> m_dragImageElement;
    std::unique_ptr<DragImageLoader> m_dragImageLoader;
#endif
};

} // namespace WebCore
