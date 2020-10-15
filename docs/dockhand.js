#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const cmark = require('cmark-gfm');
const mkdirp = require('mkdirp');
const jsdom = require('jsdom');
const npm = require('../lib/npm.js')

const config = require('./config.json');

const docsRoot = __dirname;
const inputRoot = path.join(docsRoot, 'content');
const outputRoot = path.join(docsRoot, 'output');

const template = fs.readFileSync('template.html').toString();

walk(inputRoot);

function walk(root, dirRelative) {
    const dirPath = dirRelative ? path.join(root, dirRelative) : root;

    fs.readdirSync(dirPath).forEach((childFilename) => {
        const childRelative = dirRelative ? path.join(dirRelative, childFilename) : childFilename;
        const childPath = path.join(root, childRelative);

        if (fs.lstatSync(childPath).isDirectory()) {
            walk(root, childRelative);
        }
        else {
            translate(childRelative);
        }
    });
}

function translate(childPath) {
    const inputPath = path.join(inputRoot, childPath);

    if (!inputPath.match(/\.md$/)) {
        console.log(`warning: unknown file type ${inputPath}, ignored`);
        return;
    }

    const outputPath = path.join(outputRoot, childPath.replace(/\.md$/, '.html'));

    let md = fs.readFileSync(inputPath).toString();
    let frontmatter = { };

    // Take the leading frontmatter out of the markdown
    md = md.replace(/^---\n([\s\S]+)\n---\n/, (header, fm) => {
        frontmatter = yaml.parse(fm, 'utf8');
        return '';
    });

    // Replace any tokens in the source
    md = md.replace(/@VERSION@/, npm.version);

    // Render the markdown into an HTML snippet using a GFM renderer.
    const content = cmark.renderHtmlSync(md, {
        'smart': true,
        'githubPreLang': true,
        'strikethroughDoubleTilde': true,
        'unsafe': false,
        extensions: {
            'table': true,
            'strikethrough': true,
            'tagfilter': true,
            'autolink': true
        }
    });

    // Inject this data into the template, using a mustache-like
    // replacement scheme.
    const html = template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (token, key) => {
        switch (key) {
            case 'content':
                return content;
            case 'path':
                return childPath;
            case 'url_path':
                return encodeURI(childPath);

            case 'title':
            case 'section':
            case 'description':
                return frontmatter[key];

            case 'config.github_repo':
            case 'config.github_branch':
            case 'config.github_path':
                return config[key.replace(/^config\./, '')];

            default:
                console.log(`warning: unknown token '${token}' in ${inputPath}`);
                return '';
        }
        console.log(key);
        return key;
    });

    const dom = new jsdom.JSDOM(html);
    const document = dom.window.document;

    // Rewrite relative URLs in links and image sources to be relative to
    // this file; this is for supporting `file://` links.  HTML pages need
    // suffix appended.
    const links = [
        { tag: 'a', attr: 'href', suffix: '.html' },
        { tag: 'img', attr: 'src' }
    ];

    for (let linktype of links) {
        for (let tag of document.querySelectorAll(linktype.tag)) {
            let url = tag.getAttribute(linktype.attr);

            if (url.startsWith('/')) {
                const childDepth = childPath.split('/').length - 1;
                const prefix = childDepth > 0 ? '../'.repeat(childDepth) : './';

                url = url.replace(/^\//, prefix);

                if (linktype.suffix) {
                    url += linktype.suffix;
                }

                tag.setAttribute(linktype.attr, url);
            }
        }
    }

    // Give headers a unique id so that they can be linked within the doc
    const headerIds = [ ];
    for (let header of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
        if (header.getAttribute('id')) {
            headerIds.push(header.getAttribute('id'));
            continue;
        }

        const headerText = header.textContent.replace(/[A-Z]/g, x => x.toLowerCase()).replace(/ /g, '-').replace(/[^a-z0-9\-]/g, '');
        let headerId = headerText;
        let headerIncrement = 1;

        while (headerIds.includes(headerId)) {
            headerId = headerText + (++headerIncrement);
        }

        headerIds.push(headerId);
        header.setAttribute('id', headerId);
    }

    const output = dom.serialize();

    mkdirp.sync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, output);
}

function debug(str) {
    console.log(str);
}
