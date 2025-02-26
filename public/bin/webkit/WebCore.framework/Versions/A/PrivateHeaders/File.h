/*
 * Copyright (C) 2008-2019 Apple Inc. All Rights Reserved.
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

#include "Blob.h"
#include <wtf/FileSystem.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/TypeCasts.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class File final : public Blob {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(File, WEBCORE_EXPORT);
public:
    struct PropertyBag : BlobPropertyBag {
        std::optional<int64_t> lastModified;
    };

    // Create a file with an optional name exposed to the author (via File.name and associated DOM properties) that differs from the one provided in the path.
    WEBCORE_EXPORT static Ref<File> create(ScriptExecutionContext*, const String& path, const String& replacementPath = { }, const String& nameOverride = { }, const std::optional<FileSystem::PlatformFileID>& fileID = { });

    // Create a File using the 'new File' constructor.
    static Ref<File> create(ScriptExecutionContext& context, Vector<BlobPartVariant>&& blobPartVariants, const String& filename, const PropertyBag& propertyBag)
    {
        auto file = adoptRef(*new File(context, WTFMove(blobPartVariants), filename, propertyBag));
        file->suspendIfNeeded();
        return file;
    }

    static Ref<File> deserialize(ScriptExecutionContext* context, const String& path, const URL& srcURL, const String& type, const String& name, const std::optional<int64_t>& lastModified = std::nullopt)
    {
        auto file = adoptRef(*new File(deserializationContructor, context, path, srcURL, type, name, lastModified));
        file->suspendIfNeeded();
        return file;
    }

    static Ref<File> create(ScriptExecutionContext* context, const Blob& blob, const String& name)
    {
        auto file = adoptRef(*new File(context, blob, name));
        file->suspendIfNeeded();
        return file;
    }

    static Ref<File> create(ScriptExecutionContext* context, const File& existingFile, const String& name)
    {
        auto file = adoptRef(*new File(context, existingFile, name));
        file->suspendIfNeeded();
        return file;
    }

    static Ref<File> createWithRelativePath(ScriptExecutionContext*, const String& path, const String& relativePath);

    bool isFile() const override { return true; }

    const String& path() const { return m_path; }
    const String& relativePath() const { return m_relativePath; }
    void setRelativePath(const String& relativePath) { m_relativePath = relativePath; }
    const String& name() const { return m_name; }
    WEBCORE_EXPORT int64_t lastModified() const; // Number of milliseconds since Epoch.
    const std::optional<int64_t>& lastModifiedOverride() const { return m_lastModifiedDateOverride; } // Number of milliseconds since Epoch.
    const std::optional<FileSystem::PlatformFileID> fileID() const { return m_fileID; }

    WEBCORE_EXPORT static String contentTypeForFile(const String& path);

#if ENABLE(FILE_REPLACEMENT)
    static bool shouldReplaceFile(const String& path);
#endif

    bool isDirectory() const;

private:
    WEBCORE_EXPORT explicit File(ScriptExecutionContext*, const String& path);
    File(ScriptExecutionContext*, URL&&, String&& type, String&& path, String&& name);
    File(ScriptExecutionContext&, Vector<BlobPartVariant>&& blobPartVariants, const String& filename, const PropertyBag&);
    File(ScriptExecutionContext*, URL&&, String&& type, String&& path, String&& name, const std::optional<FileSystem::PlatformFileID>&);
    File(ScriptExecutionContext*, const Blob&, const String& name);
    File(ScriptExecutionContext*, const File&, const String& name);

    File(DeserializationContructor, ScriptExecutionContext*, const String& path, const URL& srcURL, const String& type, const String& name, const std::optional<int64_t>& lastModified);

    static void computeNameAndContentType(const String& path, const String& nameOverride, String& effectiveName, String& effectiveContentType);
#if ENABLE(FILE_REPLACEMENT)
    static void computeNameAndContentTypeForReplacedFile(const String& path, const String& nameOverride, String& effectiveName, String& effectiveContentType);
#endif

    String m_path;
    String m_relativePath;
    String m_name;

    std::optional<int64_t> m_lastModifiedDateOverride;
    std::optional<FileSystem::PlatformFileID> m_fileID;
    mutable std::optional<bool> m_isDirectory;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::File)
    static bool isType(const WebCore::Blob& blob) { return blob.isFile(); }
SPECIALIZE_TYPE_TRAITS_END()
