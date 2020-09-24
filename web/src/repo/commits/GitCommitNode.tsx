import copy from 'copy-to-clipboard'
import ContentCopyIcon from 'mdi-react/ContentCopyIcon'
import FileDocumentIcon from 'mdi-react/FileDocumentIcon'
import React, { useState, useCallback } from 'react'
import { pluralize } from '../../../../shared/src/util/strings'
import { Timestamp } from '../../components/time/Timestamp'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { GitCommitNodeByline } from './GitCommitNodeByline'
import { GitCommitFields } from '../../graphql-operations'
import { Link } from '../../../../shared/src/components/Link'
import { TelemetryProps } from '../../../../shared/src/telemetry/telemetryService'
import classNames from 'classnames'

export interface GitCommitNodeProps extends TelemetryProps {
    node: GitCommitFields

    /** An optional additional CSS class name to apply to this element. */
    className?: string

    /** Display in a single line (more compactly). */
    compact?: boolean

    /** Expand the commit message body. */
    expandCommitMessageBody?: boolean

    /** Hide the button to expand the commit message body. */
    hideExpandCommitMessageBody?: boolean

    /** Show the full 40-character SHA and parents on their own row. */
    showSHAAndParentsRow?: boolean

    /** Fragment to show at the end to the right of the SHA. */
    afterElement?: React.ReactFragment
}

/** Displays a Git commit. */
export const GitCommitNode: React.FunctionComponent<GitCommitNodeProps> = ({
    node,
    afterElement,
    className,
    compact,
    expandCommitMessageBody,
    hideExpandCommitMessageBody,
    showSHAAndParentsRow,
    telemetryService,
}) => {
    const [showCommitMessageBody, setShowCommitMessageBody] = useState<boolean>(false)
    const [flashCopiedToClipboardMessage, setFlashCopiedToClipboardMessage] = useState<boolean>(false)

    const toggleShowCommitMessageBody = useCallback((): void => {
        telemetryService.log('CommitBodyToggled')
        setShowCommitMessageBody(!showCommitMessageBody)
    }, [showCommitMessageBody, telemetryService])

    const copyToClipboard = useCallback((): void => {
        telemetryService.log('CommitSHACopiedToClipboard')
        copy(node.oid)
        setFlashCopiedToClipboardMessage(true)
        Tooltip.forceUpdate()
        setTimeout(() => {
            setFlashCopiedToClipboardMessage(false)
            Tooltip.forceUpdate()
        }, 1500)
    }, [node.oid, telemetryService])

    const bylineElement = (
        <GitCommitNodeByline
            className="text-muted git-commit-node__byline"
            author={node.author}
            committer={node.committer}
            compact={Boolean(compact)}
        />
    )
    const messageElement = (
        <div className="git-commit-node__message flex-grow-1">
            <Link
                to={node.canonicalURL}
                className="git-commit-node__message-subject pr-2 text-reset"
                title={node.message}
            >
                {node.subject}
            </Link>
            {node.body && !hideExpandCommitMessageBody && !expandCommitMessageBody && (
                <button
                    type="button"
                    className="btn btn-secondary btn-sm px-1 py-0 font-weight-bold align-item-center mr-2"
                    onClick={toggleShowCommitMessageBody}
                >
                    &#8943;
                </button>
            )}
            {compact && (
                <small className="text-muted git-commit-node__message-timestamp">
                    <Timestamp noAbout={true} date={node.committer ? node.committer.date : node.author.date} />
                </small>
            )}
        </div>
    )
    const oidElement = <code className="git-commit-node__oid">{node.abbreviatedOID}</code>
    return (
        <div
            key={node.id}
            className={classNames('git-commit-node p-2', compact && 'git-commit-node--compact', className)}
        >
            <div className="w-100 d-flex justify-content-between align-items-start flex-wrap-reverse">
                {!compact ? (
                    <>
                        <div className="git-commit-node__signature">
                            {messageElement}
                            {bylineElement}
                        </div>
                        <div className="git-commit-node__actions">
                            {!showSHAAndParentsRow && (
                                <div className="btn-group btn-group-sm" role="group">
                                    <Link
                                        className="btn btn-secondary"
                                        to={node.canonicalURL}
                                        data-tooltip="View this commit"
                                    >
                                        <strong>{oidElement}</strong>
                                    </Link>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={copyToClipboard}
                                        data-tooltip={flashCopiedToClipboardMessage ? 'Copied!' : 'Copy full SHA'}
                                    >
                                        <ContentCopyIcon className="icon-inline small" />
                                    </button>
                                </div>
                            )}
                            {node.tree && (
                                <Link
                                    className="btn btn-secondary btn-sm ml-2"
                                    to={node.tree.canonicalURL}
                                    data-tooltip="View files at this commit"
                                >
                                    <FileDocumentIcon className="icon-inline small" />
                                </Link>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {bylineElement}
                        {messageElement}
                        <Link to={node.canonicalURL}>{oidElement}</Link>
                    </>
                )}
                {afterElement}
            </div>
            {(expandCommitMessageBody || showCommitMessageBody) && (
                <div className="w-100">
                    <pre className="git-commit-node__message-body">{node.body}</pre>
                </div>
            )}
            {showSHAAndParentsRow && (
                <div className="w-100 git-commit-node__sha-and-parents">
                    <code className="git-ref-tag-2 git-commit-node__sha-and-parents-sha">
                        {node.oid}{' '}
                        <button
                            type="button"
                            className="btn btn-icon git-commit-node__sha-and-parents-copy"
                            onClick={copyToClipboard}
                            data-tooltip={flashCopiedToClipboardMessage ? 'Copied!' : 'Copy full SHA'}
                        >
                            <ContentCopyIcon className="icon-inline" />
                        </button>
                    </code>
                    <div className="git-commit-node__sha-and-parents-parents">
                        {node.parents.length > 0 ? (
                            <>
                                <span className="git-commit-node__sha-and-parents-label">
                                    {node.parents.length === 1
                                        ? 'Parent'
                                        : `${node.parents.length} ${pluralize('parent', node.parents.length)}`}
                                    :
                                </span>{' '}
                                {node.parents.map((parent, index) => (
                                    <Link
                                        key={index}
                                        className="git-ref-tag-2 git-commit-node__sha-and-parents-parent"
                                        to={parent.url}
                                    >
                                        <code>{parent.abbreviatedOID}</code>
                                    </Link>
                                ))}
                            </>
                        ) : (
                            '(root commit)'
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
