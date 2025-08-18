import React, { FunctionComponent, ReactNode, Fragment } from "react";
import * as PRSS from "../../core";
import cx from "classnames";
import "./Menu.css";

interface IProps {
  name: string;
  renderItem?: any;
  renderItemLabel?: any;
  ulClassName?: string;
  mode?: string;
  style?: any;
  prependedComponent?: ReactNode;
}

const Menu: FunctionComponent<IProps> = ({
  name,
  renderItem,
  renderItemLabel,
  ulClassName = "",
  mode,
  style = {},
  prependedComponent = null
}) => {
  const menu = PRSS.getProp(`site.menus.${name}`);

  if (!menu) {
    return null;
  }

  const getFlattenedMenuNodes = nodes => {
    const items = [];
    const parseNode = node => {
      if (node) {
        items.push(node);
        if (node.children) {
          node.children.forEach(parseNode);
        }
      }
    };
    nodes.forEach(parseNode);
    return items;
  };

  const flattenedMenuNodes = getFlattenedMenuNodes(menu);

  const parseMenuNode = node => {
    const menuNodeParser =
      mode === "prev-next"
        ? prevNextRenderItem
        : renderItem || defaultRenderItem;
    return menuNodeParser(node, parseMenuNode);
  };

  const prevNextRenderItem = (node) => {
    const activeItemIndex = flattenedMenuNodes.findIndex(
      curNode => curNode.key === PRSS.getProp("item").uuid
    );
    const prevItem = flattenedMenuNodes[activeItemIndex - 1]
      ? flattenedMenuNodes[activeItemIndex - 1]
      : null;
    const nextItem = flattenedMenuNodes[activeItemIndex + 1]
      ? flattenedMenuNodes[activeItemIndex + 1]
      : null;

    const isPrev = prevItem ? prevItem.key === node.key : false;
    const isNext = nextItem ? nextItem.key === node.key : false;

    if (!isPrev && !isNext) {
      return null;
    }

    const post = PRSS.getItem(node.key);

    return (
      <li
        className={cx({
          "menu-item-prev": isPrev,
          "menu-item-next": isNext
        })}
        title={node.title || post?.title}
        key={node.key}
      >
        {renderItemLabel ? (
          renderItemLabel(post)
        ) : (
          <a href={post?.url}>
            <span className="menu-item-title">
              {isPrev ? "Previous" : "Next"}
            </span>
            <span className="menu-item-label">{node.title || post?.title}</span>
          </a>
        )}
      </li>
    );
  };

  const isNodeExpanded = node => {
    const activeItemId = PRSS.getProp("item").uuid;
    return node.key === activeItemId || PRSS.hasItem(activeItemId, node);
  };

  const isNodeActive = node => {
    const activeItemId = PRSS.getProp("item").uuid;
    
    // Check if this node is the active item
    if (node.key === activeItemId) {
      return true;
    }
    
    // Check if this node contains the active item in its children
    if (PRSS.hasItem(activeItemId, node)) {
      return true;
    }
    
    // Check if this node is part of the active item's ancestry path
    // by searching through the entire menu structure
    const isAncestorOfActive = (menuNodes, targetNodeKey) => {
      for (const menuNode of menuNodes) {
        if (menuNode.key === activeItemId) {
          // Found the active item, now check if targetNodeKey is in its path
          return false; // This item is the active one, not an ancestor
        }
        if (menuNode.children && menuNode.children.length) {
          // Check if the active item is in this branch
          if (PRSS.hasItem(activeItemId, menuNode)) {
            // The active item is somewhere in this branch
            if (menuNode.key === targetNodeKey) {
              return true; // This node is an ancestor of the active item
            }
            // Recursively check children
            if (isAncestorOfActive(menuNode.children, targetNodeKey)) {
              return true;
            }
          }
        }
      }
      return false;
    };
    
    return isAncestorOfActive(menu, node.key);
  };

  const defaultRenderItem = (node, parseMenuNode) => {
    const post = PRSS.getItem(node.key);
    return (
      <li
        title={node.title || post?.title}
        className={cx({
          active: isNodeActive(node),
          expanded: isNodeExpanded(node)
        })}
        key={node.key}
      >
        {renderItemLabel ? (
          renderItemLabel(post)
        ) : (
          <a href={post?.url}>{node.title || post?.title}</a>
        )}
        {node.children && !!node.children.length && (
          <ul>{node.children.map(parseMenuNode)}</ul>
        )}
      </li>
    );
  };

  const formattedMenu =
    mode === "prev-next"
      ? flattenedMenuNodes.map(parseMenuNode)
      : menu.map(parseMenuNode);

  const hasItems = formattedMenu.filter(elem => !!elem);

  if (!hasItems.length) {
    return null;
  }

  return (
    <Fragment>
      {prependedComponent}
      <ul
        className={cx("page-menu", ulClassName, {
          [`mode-${mode}`]: mode
        })}
        style={style}
      >
        {formattedMenu}
      </ul>
    </Fragment>
  );
};

export default Menu;
