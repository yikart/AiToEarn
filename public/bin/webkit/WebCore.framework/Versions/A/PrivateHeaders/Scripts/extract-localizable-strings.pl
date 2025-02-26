#!/usr/bin/env perl

# Copyright (C) 2006-2021 Apple Inc. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#
# 1.  Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer. 
# 2.  Redistributions in binary form must reproduce the above copyright
#     notice, this list of conditions and the following disclaimer in the
#     documentation and/or other materials provided with the distribution. 
# 3.  Neither the name of Apple Inc. ("Apple") nor the names of
#     its contributors may be used to endorse or promote products derived
#     from this software without specific prior written permission. 
#
# THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
# EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
# THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

# This script is like the genstrings tool (minus most of the options) with these differences.
#
#    1) It uses the names UI_STRING and UI_STRING_WITH_KEY for the macros, rather than the macros
#       from NSBundle.h, and doesn't support tables (although they would be easy to add).
#    2) It supports UTF-8 in key strings (and hence uses "" strings rather than @"" strings;
#       @"" strings only reliably support ASCII since they are decoded based on the system encoding
#       at runtime, so give different results on US and Japanese systems for example).
#    3) It looks for strings that are not marked for localization, using both macro names that are
#       known to be used for debugging in Intrigue source code and an exceptions file.
#    4) It finds the files to work on rather than taking them as parameters, and also uses a
#       hardcoded location for both the output file and the exceptions file.
#       It would have been nice to use the project to find the source files, but it's too hard to
#       locate source files after parsing a .pbxproj file.

# The exceptions file has a list of strings in quotes, filenames, and filename/string pairs separated by :.

use strict;
use warnings;
use File::Compare;
use File::Copy;
use FindBin;
use Getopt::Long;
use lib $FindBin::Bin;
use LocalizableStrings;
no warnings 'deprecated';

my %isDebugMacro = ( ASSERT_WITH_MESSAGE => 1, LOG_ERROR => 1, ERROR => 1, NSURL_ERROR => 1, FATAL => 1, LOG => 1, LOG_WARNING => 1, UI_STRING_LOCALIZE_LATER => 1, UI_STRING_LOCALIZE_LATER_KEY => 1, LPCTSTR_UI_STRING_LOCALIZE_LATER => 1, UNLOCALIZED_STRING => 1, UNLOCALIZED_LPCTSTR => 1, dprintf => 1, NSException => 1, NSLog => 1, printf => 1 );

my $verify;
my $exceptionsFile;
my @directoriesToSkip = ();
my $treatWarningsAsErrors;

my %options = (
    'verify' => \$verify,
    'exceptions=s' => \$exceptionsFile,
    'skip=s' => \@directoriesToSkip,
    'treat-warnings-as-errors' => \$treatWarningsAsErrors,
);

GetOptions(%options);

setTreatWarningsAsErrors($treatWarningsAsErrors);

@ARGV >= 2 or die "Usage: extract-localizable-strings [--verify] [--treat-warnings-as-errors] [--exceptions <exceptions file>] <file to update> [--skip directory | directory]...\nDid you mean to run update-webkit-localizable-strings instead?\n";

-f $exceptionsFile or die "Couldn't find exceptions file $exceptionsFile\n" unless !defined $exceptionsFile;

my $fileToUpdate = shift @ARGV;
-f $fileToUpdate or die "Couldn't find file to update $fileToUpdate\n";

my $warnAboutUnlocalizedStrings = defined $exceptionsFile;

my @directories = ();
if (@ARGV < 1) {
    push(@directories, ".");
} else {
    for my $dir (@ARGV) {
        push @directories, $dir;
    }
}

my $notLocalizedCount = 0;
my $NSLocalizeCount = 0;

my %exception;
my %usedException;

if (defined $exceptionsFile && open EXCEPTIONS, $exceptionsFile) {
    while (<EXCEPTIONS>) {
        chomp;
        if (/^"([^\\"]|\\.)*"$/ or /^[-_\/\w\s.]+.(h|m|mm|c|cpp)$/ or /^[-_\/\w\s.]+.(h|m|mm|c|cpp):"([^\\"]|\\.)*"$/) {
            if ($exception{$_}) {
                emitWarning($exceptionsFile, $., "exception for $_ appears twice");
                emitWarning($exceptionsFile, $exception{$_}, "first appearance");
            } else {
                $exception{$_} = $.;
            }
        } else {
            emitWarning($exceptionsFile, $., "syntax error");
        }
    }
    close EXCEPTIONS;
}

my $quotedDirectoriesString = '"' . join('" "', @directories) . '"';
for my $dir (@directoriesToSkip) {
    $quotedDirectoriesString .= ' -path "' . $dir . '" -prune -o';
}

my @files = ( split "\n", `find $quotedDirectoriesString \\( -name "*.h" -o -name "*.m" -o -name "*.mm" -o -name "*.c" -o -name "*.cpp" \\)` );

sub isFormatMacro($) { return ($_[0] =~ /(WEB_)?UI_FORMAT_/); }

for my $file (sort @files) {
    next if $file =~ /\/\w+LocalizableStrings\w*\.h$/ || $file =~ /\/LocalizedStrings\.h$/;

    $file =~ s-^./--;

    open SOURCE, $file or die "can't open $file\n";
    
    my $inComment = 0;
    
    my $expected = "";
    my $macroLine;
    my $macro;
    my $UIString;
    my $key;
    my $comment;
    my $isFormat;
    my $mnemonic;
    
    my $string;
    my $stringLine;
    my $nestingLevel;
    
    my $previousToken = "";

    while (<SOURCE>) {
        chomp;
        
        # Handle continued multi-line comment.
        if ($inComment) {
            next unless s-.*\*/--;
            $inComment = 0;
        }

        next unless defined $nestingLevel or /(\"|\/\*)/;
    
        # Handle all the tokens in the line.
        while (s-^\s*([#\w]+|/\*|//|[^#\w/'"()\[\],]+|.)--) {
            my $token = $1;

            if ($token eq "@" and $expected and $expected eq "a quoted string") {
                next;
            }

            if ($token eq "\"") {
                if ($expected and $expected ne "a quoted string") {
                    emitError($file, $., "found a quoted string but expected $expected");
                    $expected = "";
                }
                if (s-^(([^\\$token]|\\.)*?)$token--) {
                    if (!defined $string) {
                        $stringLine = $.;
                        $string = $1;
                    } else {
                        $string .= $1;
                    }
                } else {
                    emitError($file, $., "mismatched quotes");
                    $_ = "";
                }
                next;
            }
            
            if (defined $string) {
handleString:
                if ($expected) {
                    if (!defined $UIString) {
                        # FIXME: Validate UTF-8 here?
                        $UIString = $string;
                        $expected = ",";
                    } elsif (($macro =~ /(WEB_)?UI_(FORMAT_)?(CF|NS)?STRING_KEY(_INTERNAL)?$/) and !defined $key) {
                        # FIXME: Validate UTF-8 here?
                        $key = $string;
                        $isFormat = isFormatMacro($macro);
                        $expected = ",";
                    } elsif (($macro =~ /WEB_UI_STRING_WITH_MNEMONIC$/) and !defined $mnemonic) {
                        $mnemonic = $string;
                        $isFormat = 0;
                        $expected = ",";
                    } elsif (!defined $comment) {
                        # FIXME: Validate UTF-8 here?
                        $comment = $string;
                        $expected = ")";
                    }
                } else {
                    if (defined $nestingLevel) {
                        # In a debug macro, no need to localize.
                    } elsif ($previousToken eq "#include" or $previousToken eq "#import") {
                        # File name, no need to localize.
                    } elsif ($previousToken eq "extern" and $string eq "C") {
                        # extern "C", no need to localize.
                    } elsif ($string eq "") {
                        # Empty string can sometimes be localized, but we need not complain if not.
                    } elsif ($exception{$file}) {
                        $usedException{$file} = 1;
                    } elsif ($exception{"\"$string\""}) {
                        $usedException{"\"$string\""} = 1;
                    } elsif ($exception{"$file:\"$string\""}) {
                        $usedException{"$file:\"$string\""} = 1;
                    } else {
                        emitWarning($file, $stringLine, "\"$string\" is not marked for localization") if $warnAboutUnlocalizedStrings;
                        $notLocalizedCount++;
                    }
                }
                $string = undef;
                last if !defined $token;
            }
            
            $previousToken = $token;

            if ($token =~ /^NSLocalized/ && $token !~ /NSLocalizedDescriptionKey/ && $token !~ /NSLocalizedStringFromTableInBundle/ && $token !~ /NSLocalizedFileSizeDescription/ && $token !~ /NSLocalizedDescriptionKey/ && $token !~ /NSLocalizedRecoverySuggestionErrorKey/) {
                emitError($file, $., "found a use of an NSLocalized macro ($token); not supported");
                $nestingLevel = 0 if !defined $nestingLevel;
                $NSLocalizeCount++;
            } elsif ($token eq "/*") {
                if (!s-^.*?\*/--) {
                    $_ = ""; # If the comment doesn't end, discard the result of the line and set flag
                    $inComment = 1;
                }
            } elsif ($token eq "//") {
                $_ = ""; # Discard the rest of the line
            } elsif ($token eq "'") {
                if (!s-([^\\]|\\.)'--) { #' <-- that single quote makes the Project Builder editor less confused
                    emitError($file, $., "mismatched single quote");
                    $_ = "";
                }
            } else {
                if ((!$isFormat and $expected and $expected ne $token) or ($isFormat and $expected eq ")" and $token ne ",")) {
                    emitError($file, $., "found $token but expected $expected");
                    $expected = "";
                }
                if (($token =~ /(WEB_)?UI_(FORMAT_)?(CF|NS)?STRING(_KEY)?(_INTERNAL)?$/) || ($token =~ /WEB_UI_STRING_WITH_MNEMONIC$/)) {
                    $expected = "(";
                    $macro = $token;
                    $UIString = undef;
                    $key = undef;
                    $comment = undef;
                    $mnemonic = undef;
                    $macroLine = $.;
                    $isFormat = isFormatMacro($token);
                } elsif ($token eq "(" or $token eq "[") {
                    ++$nestingLevel if defined $nestingLevel;
                    $expected = "a quoted string" if $expected;
                } elsif ($token eq ",") {
                    $expected = "a quoted string" if $expected;
                } elsif ($token eq ")" or $token eq "]") {
                    $nestingLevel = undef if defined $nestingLevel && !--$nestingLevel;
                    if ($expected) {
                        $key = $UIString if !defined $key;
                        HandleUIString($UIString, $key, $comment, $file, $macroLine);
                        $macro = "";
                        $expected = "";
                    }
                } elsif ($isDebugMacro{$token}) {
                    $nestingLevel = 0 if !defined $nestingLevel;
                }
            }
        }
            
    }
    
    goto handleString if defined $string;
    
    if ($expected) {
        emitError($file, 0, "reached end of file but expected $expected");
    }
    
    close SOURCE;
}

print "\n" if sawError() || $notLocalizedCount || $NSLocalizeCount;

my @unusedExceptions = sort grep { !$usedException{$_} } keys %exception;
if (@unusedExceptions) {
    for my $unused (@unusedExceptions) {
        emitWarning($exceptionsFile, $exception{$unused}, "exception $unused not used");
    }
    print "\n";
}

print localizedCount() . " localizable strings\n" if localizedCount();
print keyCollisionCount() . " key collisions\n" if keyCollisionCount();
print "$notLocalizedCount strings not marked for localization\n" if $notLocalizedCount;
print "$NSLocalizeCount uses of NSLocalize\n" if $NSLocalizeCount;
print scalar(@unusedExceptions), " unused exceptions\n" if @unusedExceptions;

if (sawError()) {
    print "\nErrors encountered. Exiting without writing to $fileToUpdate.\n";
    exit 1;
}

if (-e "$fileToUpdate") {
    if (!$verify) {
        my $temporaryFile = "$fileToUpdate.updated";
        writeStringsFile($temporaryFile);

        # Avoid updating the target file's modification time if the contents have not changed.
        if (compare($temporaryFile, $fileToUpdate)) {
            move($temporaryFile, $fileToUpdate);
        } else {
            unlink $temporaryFile;
        }
    } else {
        verifyStringsFile($fileToUpdate);
    }
} else {
    print "error: $fileToUpdate does not exist\n";
    exit 1;
}
