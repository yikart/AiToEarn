#!/usr/bin/env perl
#
# Copyright (C) 2005 Apple Inc.
# Copyright (C) 2006 Anders Carlsson <andersca@mac.com>
# 
# This file is part of WebKit
# 
# This library is free software; you can redistribute it and/or
# modify it under the terms of the GNU Library General Public
# License as published by the Free Software Foundation; either
# version 2 of the License, or (at your option) any later version.
# 
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Library General Public License for more details.
# 
# You should have received a copy of the GNU Library General Public License
# along with this library; see the file COPYING.LIB.  If not, write to
# the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
# Boston, MA 02110-1301, USA.
# 

# This script is a temporary hack. 
# Files are generated in the source directory, when they really should go
# to the DerivedSources directory.
# This should also eventually be a build rule driven off of .idl files
# however a build rule only solution is blocked by several radars:
# <rdar://problems/4251781&4251785>

use strict;
use warnings;
use FindBin;
use lib '.', $FindBin::Bin;

use English;
use File::Path;
use File::Basename;
use Getopt::Long;
use Text::ParseWords;
use Cwd;
use JSON::PP;

use IDLParser;
use CodeGenerator;

my $outputDirectory;
my $outputHeadersDirectory;
my $generator;
my $defines;
my $filename;
my $prefix;
my $preprocessor;
my $writeDependencies;
my $verbose;
my $supplementalDependencyFile;
my $idlAttributesFile;
my $idlFileNamesList;

GetOptions('outputDir=s' => \$outputDirectory,
           'outputHeadersDir=s' => \$outputHeadersDirectory,
           'generator=s' => \$generator,
           'defines=s' => \$defines,
           'filename=s' => \$filename,
           'prefix=s' => \$prefix,
           'preprocessor=s' => \$preprocessor,
           'verbose' => \$verbose,
           'write-dependencies' => \$writeDependencies,
           'supplementalDependencyFile=s' => \$supplementalDependencyFile,
           'idlAttributesFile=s' => \$idlAttributesFile,
           'idlFileNamesList=s' => \$idlFileNamesList);

die('Must specify input file.') unless @ARGV;
die('Must specify generator') unless defined($generator);
die('Must specify output directory.') unless defined($outputDirectory);
die('Must specify IDL attributes file.') unless defined($idlAttributesFile);

if (!$outputHeadersDirectory) {
    $outputHeadersDirectory = $outputDirectory;
}

generateBindings($_) for (@ARGV);

sub generateBindings
{
    my ($targetIdlFile) = @_;

    $targetIdlFile = Cwd::realpath($targetIdlFile);
    if ($verbose) {
        print "$generator: $targetIdlFile\n";
    }
    my $targetInterfaceName = fileparse($targetIdlFile, ".idl");

    my $idlFound = 0;
    my %supplementalDependencies;
    if ($supplementalDependencyFile) {
        # The format of a supplemental dependency file:
        #
        # DOMWindow.idl P.idl Q.idl R.idl
        # Document.idl S.idl
        # Event.idl
        # ...
        #
        # The above indicates that DOMWindow.idl is supplemented by P.idl, Q.idl and R.idl,
        # Document.idl is supplemented by S.idl, and Event.idl is supplemented by no IDLs.
        open FH, "< $supplementalDependencyFile" or die "Cannot open $supplementalDependencyFile\n";
        while (my $line = <FH>) {
            my ($idlFile, @followingIdlFiles) = split(/\s+/, $line);
            $supplementalDependencies{fileparse($idlFile)} = [sort @followingIdlFiles] if $idlFile;
        }
        close FH;
    }

    my $input;
    {
        local $INPUT_RECORD_SEPARATOR;
        open(JSON, "<", $idlAttributesFile) or die "Couldn't open $idlAttributesFile: $!";
        $input = <JSON>;
        close(JSON);
    }

    my $jsonDecoder = JSON::PP->new->utf8;
    my $jsonHashRef = $jsonDecoder->decode($input);
    my $idlAttributes = $jsonHashRef->{attributes};

    # Parse the target IDL file.
    my $targetParser = IDLParser->new(!$verbose);
    my $targetDocument = $targetParser->Parse($targetIdlFile, $defines, $preprocessor, $idlAttributes);

    # Generate desired output for the target IDL file.
    my $codeGen = CodeGenerator->new($generator, $outputDirectory, $outputHeadersDirectory, $preprocessor, $writeDependencies, $verbose, $targetIdlFile, $idlAttributes, \%supplementalDependencies, $idlFileNamesList);
    $codeGen->ProcessDocument($targetDocument, $defines);
}
