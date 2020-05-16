let bufferItem = null;
let items = null;

export const init = (data) => {
    bufferItem = data;
};

export const getProp = (s) => {
    if (!bufferItem) {
        throw new Error('PRSS Site Configuration is not defined!');
    }

    return objGet(s, bufferItem);
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
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        return location.origin;
    else return getProp('site.url');
};

export const getPathUrl = (p = '') => {
    let siteUrl = getSiteUrl();
    if (siteUrl && siteUrl.length && siteUrl[siteUrl.length - 1] !== '/') {
        siteUrl += '/';
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
        const interval = Math.floor(timeAgoInSeconds / seconds);

        if (interval >= 1) {
            return {
                interval: interval,
                epoch: name
            };
        }
    }
};

export const timeAgo = (date) => {
    const timeAgoInSeconds = Math.floor((new Date() - new Date(date)) / 1000);
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

export const getRawPostItem = (postId) => {
    const prssItems = PRSSItems || [];

    return prssItems.find((item) => {
        return item.uuid === postId;
    });
};

export const getItem = (postId) => {
    return getItems().find((item) => item.uuid === postId);
};

export const getItems = (itemTemplate, sortItems) => {
    if (!PRSSItems) {
        return [];
    }

    const { structure } = getProp('site');
    const structurePaths = getStructurePaths(structure);

    const parsedItems =
        items ||
        structurePaths.map((item) => {
            const path = item.split('/');
            let post;

            const mappedPath = path.map((postId) => {
                if (!postId) {
                    return '';
                }

                post = getRawPostItem(postId);
                return post.slug;
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

    if (!items && parsedItems.length) {
        items = parsedItems;
    }

    let outputItems = parsedItems;

    if (itemTemplate) {
        outputItems = outputItems.filter(
            (item) => item.template === itemTemplate
        );
    }

    if (sortItems) {
        outputItems = outputItems.sort((a, b) => b.createdAt - a.createdAt);
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
