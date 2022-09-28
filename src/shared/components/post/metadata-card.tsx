import { Component, linkEvent } from "inferno";
import { Post } from "lemmy-js-client";
import { i18n } from "../../i18next";
import { relTags } from "../../utils";
import { Icon } from "../common/icon";

interface MetadataCardProps {
  post: Post;
}

interface MetadataCardState {
  expanded: boolean;
}

export class MetadataCard extends Component<
  MetadataCardProps,
  MetadataCardState
> {
  private emptyState: MetadataCardState = {
    expanded: false,
  };

  constructor(props: any, context: any) {
    super(props, context);
    this.state = this.emptyState;
  }

  render() {
    let post = this.props.post;
    return (
      <>
        {post.embed_title && !this.state.expanded && (
          <div class="card border-secondary mt-3 mb-2">
            <div class="row">
              <div class="col-12">
                <div class="card-body">
                  {this.twitch && this.twitchVideo}
                  {post.name !== post.embed_title && [
                    <h5 class="card-title d-inline">
                      <a
                        class="text-body"
                        href={post.url}
                        rel={relTags}
                        target="_blank"
                      >
                        {post.embed_title}
                      </a>
                    </h5>,
                    <span class="d-inline-block ml-2 mb-2 small text-muted">
                      <a
                        class="text-muted font-italic"
                        href={post.url}
                        rel={relTags}
                        target="_blank"
                      >
                        {new URL(post.url).hostname}
                        <Icon icon="external-link" classes="ml-1" />
                      </a>
                    </span>,
                  ]}
                  {post.embed_description && (
                    <div
                      className="card-text small text-muted md-div"
                      dangerouslySetInnerHTML={{
                        __html: post.embed_description,
                      }}
                    />
                  )}
                  {post.embed_html && (
                    <button
                      class="mt-2 btn btn-secondary text-monospace"
                      onClick={linkEvent(this, this.handleIframeExpand)}
                      data-tippy-content={i18n.t("expand_here")}
                    >
                      {this.state.expanded ? "-" : "+"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.expanded && (
          <div
            class="mt-3 mb-2"
            dangerouslySetInnerHTML={{ __html: post.embed_html }}
          />
        )}
      </>
    );
  }

  handleIframeExpand(i: MetadataCard) {
    i.state.expanded = !i.state.expanded;
    i.setState(i.state);
  }
  get twitch() {
    let post = this.props.post;
    return post.url && new URL(post.url).hostname.includes("twitch.tv");
  }

  get twitchVideo() {
    let post = this.props.post;
    let twitchName = new URL(post.url).pathname.slice(1);
    return (
      <>
        <div class="my-2 d-none d-sm-block">
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchName}&parent=thisisthe.run&muted=false&autoplay=false`}
            height="400"
            width="100%"
            allowFullScreen
            title={twitchName}
          />
        </div>
        <div className="my-2 d-block d-sm-none">
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchName}&parent=thisisthe.run&muted=false&autoplay=false`}
            height="400"
            width="100%"
            allowFullScreen
            title={twitchName}
          />
        </div>
      </>
    );
  }
}
