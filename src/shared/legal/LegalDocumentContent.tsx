import type { LegalDocumentKind } from './agreements'
import { getLegalDocument } from './agreements'
import './LegalDocumentContent.scss'

export interface LegalDocumentContentProps {
  kind: LegalDocumentKind
}

export default defineComponent({
  name: 'LegalDocumentContent',
  props: {
    kind: { type: String as PropType<LegalDocumentKind>, required: true }
  },
  setup(props) {
    const document = computed(() => getLegalDocument(props.kind))

    return () => (
      <article class="legal-document-content">
        <header class="legal-document-content__header">
          <span class="legal-document-content__eyebrow">STARLIGHT LEGAL</span>
          <h1 class="legal-document-content__title">{document.value.title}</h1>
          <p class="legal-document-content__summary">{document.value.summary}</p>
          <span class="legal-document-content__updated">更新日期：{document.value.updatedAt}</span>
        </header>
        <div class="legal-document-content__sections">
          {document.value.sections.map((section) => (
            <section key={section.title} class="legal-document-content__section">
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    )
  }
})
