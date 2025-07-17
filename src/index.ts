let bufferItem = null;
let items = null;

export const init = (data) => {
    if(data) {
        bufferItem = data;
    } else {
        console.error("Attempted to load empty data", data);
    }
};

export const getProp = (s, bufferItemOverride?) => {
    if (!bufferItem && !bufferItemOverride) {
        return undefined;
    }

    return objGet(s, bufferItemOverride || bufferItem);
};

export const getJsonProp = (s) => {
    let output;

    if (propExists(s)) {
        try {
            output = JSON.parse(getProp(s));
        } catch (e) {
            console.error(`Prop '${s}' could not be parsed.`, e);
        }
    }

    return output;
};

export const propExists = (s) => {
    return typeof getProp(s) !== 'undefined';
};

export const objGet = (s, obj) =>
    s.split('.').reduce((a, b) => (a ? a[b] : ''), obj);

export const getAllProps = () => {
    return bufferItem;
};

export const getSiteUrl = () => {
    const siteUrl = getProp('site.url');
    if(siteUrl){
        return siteUrl.replaceAll("localhost:9000", "localhost:3000");
    } else {
        return "http://localhost:3000";
    }
};

export const getPathUrl = (p = '') => {
    let siteUrl = getSiteUrl();
    if (siteUrl && siteUrl.length && siteUrl[siteUrl.length - 1] !== '/') {
        siteUrl += '/';
    }

    if (p && p.length && p[p.length - 1] !== '/') {
        p += '/';
    }

    return siteUrl + p;
};

const getDuration = (timeAgoInSeconds) => {
    const epochs = [
        ['year', 31536000],
        ['month', 2592000],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1]
    ];

    for (let [name, seconds] of epochs) {
        const interval = Math.floor(timeAgoInSeconds / (seconds as number));

        if (interval >= 1) {
            return {
                interval: interval,
                epoch: name
            };
        } else {
            return {
                interval: 0,
                epoch: "minute"
            };
        }
    }
};

export const timeAgo = (date) => {
    const timeAgoInSeconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const { interval, epoch } = getDuration(timeAgoInSeconds);
    const suffix = interval === 1 ? '' : 's';

    return `${interval} ${epoch}${suffix} ago`;
};

export const formattedDate = (date) => {
    const d = new Date(date);
    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);

    return `${da} ${mo}, ${ye}`;
};

export const getStructurePaths = (nodes, prefix = '', store = []) => {
    nodes.forEach((node) => {
        const pathNode = node.key;
        const curPath = `${prefix}/${pathNode}`;

        store.push(curPath);

        if (node.children) {
            getStructurePaths(node.children, curPath, store);
        }
    });

    return store;
};

export const getRawPostItem = (postId, itemsOverride?) => {
    const prssItems = itemsOverride || PRSSItems || [];

    return prssItems.find((item) => {
        return item.uuid === postId;
    });
};

export const stripShortcodes = (html) => {
    let output = html;
    const shortcodeRegex =
        /\[([a-zA-Z]+)=?([a-zA-Z0-9]+)?\](.+?)\[\/[a-zA-Z]+\]?/gi;
    const matches = [...output.matchAll(shortcodeRegex)];
    matches.forEach((match) => {
        const [fullMatch] = match;

        if (fullMatch) {
            output = output.replace(fullMatch, "");
        }
    });
    return output;
};

export const truncateString = (str = "", maxLength = 50) => {
    const output = str.replace(/"/g, "").replace(/\s+/g, " ").trim();
    if (!output) return null;
    if (output.length <= maxLength) return output;
    return `${output.substring(0, maxLength)}...`;
};

export const removeTagsFromElem = (doc, tags) =>
    tags.forEach((tag) =>
        doc.querySelectorAll(tag).forEach((elem) => (elem.innerHTML = ""))
    );

export const stripTags = (html) => {
    const rawHtml = stripShortcodes(html);
    const doc = new DOMParser().parseFromString(rawHtml, "text/html");
    removeTagsFromElem(doc, ["pre", "h1", "h2"]);
    return doc.body.textContent || "";
};

export const setContent = (selector, html, createIfMissing = false) => {
    let element = document.querySelector(selector);
    let shouldAppend;

    if(!element && createIfMissing && selector.includes(".") && selector.split(".").length === 2){
        const [tagName, className] = selector.split(".");
        element = document.createElement(tagName);
        element.className = className;
        shouldAppend = true;
    }

    if(element){
        element.innerHTML = html;
    }

    if(shouldAppend){
        document.body.appendChild(element);
    }
};

export const getItemBySlug = (slug) => {
    return getItems().find((item) => item.slug === slug);
};

export const getComponent = (slug) => {
    return getItems().find((item) => item.template === "component" && item.slug === slug);
};

export const getItem = (postId) => {
    const item = getItems().find((item) => item.uuid === postId);

    if(!item){
        console.error(`getItem: No item found with id ${postId}`);
    } else {
        return item;
    }
};

export const appendToHead = (html) => document.head.innerHTML += html;

export const appendToBody = (html) => document.body.innerHTML += html;

export const getItems = (itemTemplate?, sortItems?, itemsOverride?) => {
    if (!PRSSItems && !itemsOverride) {
        console.error("getItems: No PRSSItems found.");
        return [];
    }

    const { structure } = getProp('site');
    const structurePaths = getStructurePaths(structure);

    const parsedItems =
        structurePaths.map((item) => {
            const path = item.split('/');
            let post;

            const mappedPath = path.map((postId) => {
                if (!postId) {
                    return '';
                }

                post = getRawPostItem(postId);
                return post ? post.slug : '';
            });

            const basePostPathArr = mappedPath.slice(2);
            const postPath = basePostPathArr.join('/');

            return post
                ? {
                    ...post,
                    path: postPath,
                    url: getPathUrl(postPath)
                }
                : null;
        });

    if (!items && parsedItems.length && !itemsOverride) {
        items = parsedItems;
    }

    let outputItems = parsedItems;

    if (itemTemplate) {
        if(Array.isArray(itemTemplate)){
            outputItems = outputItems.filter((item) => itemTemplate.includes(item.template));
        } else {
            outputItems = outputItems.filter(
                (item) => item.template === itemTemplate
            );
        }
    }

    if (sortItems) {
        outputItems = outputItems.sort((a, b) => b.createdAt - a.createdAt);
    }

    if(itemsOverride){
        outputItems = outputItems.filter((item) => !!itemsOverride.find(({ uuid }) => uuid === item.uuid));
    }

    return outputItems;
};

export const walkStructure = (nodes, itemCb = null) => {
    let outputNodes = [...nodes];

    const parseNodes = (obj) => {
        const { key, children = [] } = obj;
        const post = getRawPostItem(key);

        if (!post) return obj;

        const parsedNode = {
            key,
            ...(itemCb ? itemCb(post) : {}),
            children: children.map(parseNodes)
        };

        return parsedNode;
    };

    outputNodes = outputNodes.map((node) => parseNodes(node));

    return outputNodes;
};

export const shuffle = (arr = []) => {
    const newArr = [...arr];
    let currentIndex = newArr.length,
        temporaryValue,
        randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = newArr[currentIndex];
        newArr[currentIndex] = newArr[randomIndex];
        newArr[randomIndex] = temporaryValue;
    }

    return newArr;
};

export const hasItem = (uuid, nodes) => {
    return JSON.stringify(nodes).includes(uuid);
};

export const findInStructure = (postId) => {
    const { structure } = getProp('site');
    let foundItem;

    const checkNode = (node) => {
        if (node.key === postId) {
            foundItem = node;
            return true;
        } else {
            return node.children ? node.children.some(checkNode) : false;
        }
    };

    structure.some(checkNode);
    return foundItem;
};

export const getItemChildren = (itemId) => {
    const structureItem = findInStructure(itemId);
    const structureItemChildren =
        structureItem && structureItem.children ? structureItem.children : [];
    return structureItemChildren.map((childItem) => getItem(childItem.key));
};

export const getItemChildrenBySlug = (slug) => {
    const itemId = getItemBySlug(slug)?.uuid;
    return getItemChildren(itemId);
};

export const truncateStr = (str, len = 50) => {
    if (str.length > len) return str.substring(0, len) + '...';
    else return str;
};
